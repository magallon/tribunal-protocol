# 🏛️ TRIBUNAL Protocol

**Agent-to-Agent Quality Assurance Framework for Code Repositories**

> *Ningún agente debe ser juez y parte de su propio código.*  
> *No agent should judge its own code.*

---

TRIBUNAL es un framework de proceso — no una librería, no un plugin, no un CLI. Es un conjunto de convenciones, plantillas y un script ligero que establece un sistema de revisión de código tripartito entre agentes de IA independientes. Se instala copiando archivos a tu repositorio. Funciona con cualquier lenguaje, cualquier framework, cualquier modelo de IA.

---

## Inicio Rápido

```bash
# 1. Clona y copia los archivos a tu proyecto
git clone https://github.com/tu-org/tribunal-protocol.git
cp -r tribunal-protocol/docs/reviews/ tu-proyecto/docs/reviews/
cp -r tribunal-protocol/scripts/tribunal/ tu-proyecto/scripts/tribunal/
cp tribunal-protocol/LLM.md tu-proyecto/
cp tribunal-protocol/AGENTS.md tu-proyecto/

# 2. Crea una auditoría a partir de la plantilla
cp docs/reviews/TEMPLATE.md docs/reviews/security-audit-20250715.md

# 3. Pásale el archivo a una IA como Auditor (Fase 1)
# 4. Pásale el resultado a otra IA/sesión como Ejecutor (Fase 2)
# 5. Pásale la bitácora + diff a un modelo frontera como Juez (Fase 3)
```

**[→ Ver un ejemplo completo con las 3 fases terminadas](docs/reviews/security-audit-20250715.md)**

---

## El Problema

Los equipos que usan IA para programar enfrentan un patrón recurrente: le piden al mismo modelo que escriba código y luego lo audite. Esto produce **cámaras de eco**. La IA confirma sus propias decisiones, subestima los defectos que ella misma introdujo, y alucina correcciones que no resuelven problemas reales. Es el equivalente a que un empleado redacte su propia evaluación de desempeño.

TRIBUNAL resuelve esto separando el proceso en **tres roles ejecutados por agentes o sesiones distintas**, donde ninguno evalúa su propio trabajo.

---

## Cómo Funciona

El protocolo opera en tres fases secuenciales. Cada fase la ejecuta un agente de IA diferente (modelo distinto, sesión distinta, o ambas). El artefacto central es un único archivo Markdown con frontmatter YAML que viaja por las tres fases, acumulando información.

```
  Fase 1               Fase 2                Fase 3
┌────────────┐       ┌────────────┐       ┌────────────┐
│  CHECKER   │       │   MAKER    │       │   JUDGE    │
│  (Auditor) │──────▸│ (Ejecutor) │──────▸│   (Juez)   │
│            │Report.│            │Código+│            │
│  Escanea   │  de   │ Implementa │Tabla +│  Evalúa a  │
│  código    │hallaz.│ o rechaza  │ Diff  │  ambos y   │
│  crudo     │       │ con argum. │       │  veredicta │
└────────────┘       └────────────┘       └────────────┘
  IA/Sesión A          IA/Sesión B         Modelo Frontera
```

### Fase 1 — El Auditor (Checker)

Una IA recibe un componente específico y una mira concreta (seguridad, rendimiento, accesibilidad, arquitectura). No ve soluciones previas ni tiene contexto de decisiones pasadas. Analiza el código crudo y produce un reporte exhaustivo con hallazgos numerados (`F-001`, `F-002`...), severidad, evidencia reproducible y sugerencia de remediación para cada uno.

Al terminar, el campo `status` del YAML pasa de `draft` a `audited`.

### Fase 2 — El Ejecutor (Maker)

Un agente o sesión **distinta** lee el reporte completo de la Fase 1 junto con el código fuente. Para cada hallazgo, decide una de tres acciones: implementar tal cual, implementar con variación, o rechazar. Modifica el código fuente y rellena cuatro tablas obligatorias en el mismo archivo:

- **Cambios Ejecutados** — qué se implementó y en qué archivos
- **Cambios Rechazados** — con refutación técnica argumentada (no basta decir "no aplica")
- **Cambios Parciales** — qué se hizo y qué queda pendiente con justificación
- **Hallazgos Emergentes** — problemas o mejoras que el Ejecutor descubrió *durante* la implementación y que no estaban en el reporte original (prefijo `E-`)

El `status` pasa a `implemented` y se registra el hash de commit o tag.

### Fase 3 — El Juez (Judge)

Un modelo frontera con alto presupuesto de razonamiento. Su mandato es exclusivamente evaluativo — **no escribe código**. Recibe la bitácora completa (reporte + tabla de disposición) y el **diff del commit** del Ejecutor. Emite:

- Puntuaciones numéricas (0–100) para el Auditor y el Ejecutor
- Un veredicto formal: `approved`, `conditionally-approved`, `rejected`, o `escalated`
- Un diagnóstico que responde: ¿Hubo falsos positivos que presionaron al Ejecutor? ¿El diff introduce regresiones o rompe consistencia? ¿Se detectó desviación arquitectónica? ¿Los hallazgos emergentes revelan puntos ciegos del Auditor?
- Líneas rectoras correctivas para futuras iteraciones del proyecto

El `status` pasa a `verified`, `rejected`, o `escalated`.

> **Nota:** El Juez no necesita el código fuente completo del proyecto. Recibe la bitácora (que ya contiene los hallazgos, ubicaciones y decisiones) más el diff del commit para verificar que los cambios implementados corresponden con lo documentado y no introducen problemas nuevos.

---

## Glosario

| Término | Rol | Descripción |
|:--------|:----|:------------|
| **Checker** | Auditor (Fase 1) | La IA que escanea y reporta hallazgos |
| **Maker** | Ejecutor (Fase 2) | La IA que implementa o rechaza los hallazgos |
| **Judge** | Juez (Fase 3) | La IA que evalúa a ambos y emite veredicto |
| **Ledger** | — | Índice auto-generado de todas las revisiones |
| **Hallazgo** | `F-001`... | Problema encontrado por el Auditor |
| **Emergente** | `E-001`... | Problema encontrado por el Ejecutor durante la implementación |
| **Bitácora** | — | El archivo `.md` completo con las fases rellenadas |

---

## Agnóstico por Diseño

TRIBUNAL no está acoplado a ningún stack tecnológico, modelo de IA ni herramienta de desarrollo.

| Dimensión | TRIBUNAL es compatible con... |
|:----------|:------------------------------|
| **Lenguaje** | Cualquiera. El objeto de auditoría es código fuente en cualquier lenguaje. |
| **Framework** | React, Vue, Django, Rails, Spring, FastAPI, o código sin framework. |
| **Modelo de IA** | Claude, GPT, Gemini, Qwen, Llama, Mistral, DeepSeek, o cualquier LLM. Los tres roles pueden usar modelos distintos. |
| **IDE / Herramienta** | Cursor, Windsurf, Cline, OpenCode, Claude Code, chat web, API directa, o terminal. |
| **Hosting** | GitHub, GitLab, Bitbucket, o cualquier repositorio Git. |
| **CI/CD** | Se integra como hook o step sin dependencias. |

**Dependencias:** Ninguna. El protocolo son archivos Markdown planos. Opcionalmente, Node.js ≥ 16 para el script del Ledger (índice auto-generado), pero no es requisito.

---

## Cuándo Usar TRIBUNAL

TRIBUNAL está diseñado para auditorías puntuales y profundas, no para cada commit trivial. Úsalo cuando:

- Un componente maneja **datos sensibles** (pagos, autenticación, PII) y necesitas una revisión de seguridad formal
- Estás haciendo un **refactor arquitectónico** y quieres verificar que no se introdujeron regresiones
- Un módulo tiene **problemas de rendimiento** y necesitas un análisis estructurado antes de optimizar
- Quieres una **auditoría de accesibilidad** sobre un flujo de usuario completo
- Necesitas **evidencia documentada** de que se realizó una revisión de calidad (compliance, auditorías internas)
- Sospechas que tu IA de cabecera está **confirmando sus propios errores** y quieres una segunda opinión independiente

No es necesario para cambios cosméticos, actualizaciones de dependencias rutinarias, o features triviales donde el riesgo es bajo.

---

## Qué Contiene Este Repositorio

```
tribunal-protocol/
│
├── LLM.md                              # Puntero raíz — cualquier IA lo lee
├── AGENTS.md                            # Puntero para Cline, Windsurf, OpenCode
├── .cursorrules                         # Puntero para Cursor IDE
│
├── docs/
│   └── reviews/
│       ├── PROTOCOL.md                  # Documentación interna del proceso
│       ├── TEMPLATE.md                  # Plantilla base con YAML de 3 roles
│       ├── README.md                    # The Ledger (índice auto-generado)
│       └── security-audit-20250715.md   # ⭐ Ejemplo completo con 3 fases
│
└── scripts/
    └── tribunal/
        └── update-reviews.js            # Genera el Ledger (opcional, Node.js)
```

### Descripción de cada archivo

**`TEMPLATE.md`** — El corazón del framework. Es la plantilla que se copia para cada nueva revisión. Contiene un frontmatter YAML de ~40 campos estructurados en cuatro bloques (metadatos generales, auditor, ejecutor, juez) y el cuerpo Markdown con las secciones que cada fase debe rellenar. Nunca se edita directamente; se copia con el nombre del tipo de auditoría y fecha.

**`PROTOCOL.md`** — Documentación completa del proceso para referencia humana y de agentes. Describe los roles, las reglas, las convenciones de nombrado y el flujo de estados.

**`LLM.md`** — Un archivo breve en la raíz del proyecto que actúa como puntero universal. Cuando una IA recibe el repositorio completo (en un chat web, por API, o cualquier otro medio), este archivo le indica que existe un protocolo de QA y le señala dónde leer la plantilla obligatoria. No contiene reglas — solo apunta.

**`AGENTS.md`** — Mismo propósito que `LLM.md`, pero en el formato que reconocen herramientas como Cline, Windsurf y OpenCode.

**`.cursorrules`** — Mismo propósito, en formato JSON para Cursor IDE.

**`update-reviews.js`** — Script de Node.js sin dependencias externas. Lee el frontmatter YAML de todos los archivos `.md` en `docs/reviews/`, extrae los campos clave (tipo, modelos, estado, veredicto) y genera un `README.md` dinámico dentro de esa misma carpeta. Este README es "The Ledger": un índice cronológico con badges de estado que permite ver de un vistazo el historial completo de revisiones del proyecto.

**[`security-audit-20250715.md`](docs/reviews/security-audit-20250715.md)** — Un ejemplo funcional con los tres roles completados: 4 hallazgos del Auditor, tabla de disposición con 3 aceptados y 1 rechazado con refutación técnica, 1 hallazgo emergente, y veredicto del Juez con calificaciones. Es la mejor referencia para entender cómo luce un ciclo TRIBUNAL terminado.

---

## Instalación

TRIBUNAL se instala copiando archivos. No hay `npm install`, no hay CLI global.

### Opción A — Clonar y copiar

```bash
git clone https://github.com/tu-org/tribunal-protocol.git
cp -r tribunal-protocol/docs/reviews/ tu-proyecto/docs/reviews/
cp -r tribunal-protocol/scripts/tribunal/ tu-proyecto/scripts/tribunal/
cp tribunal-protocol/LLM.md tu-proyecto/
cp tribunal-protocol/AGENTS.md tu-proyecto/
```

### Opción B — Copiar manualmente

Copia estas carpetas y archivos a tu repositorio:

1. `docs/reviews/` — contiene `TEMPLATE.md`, `PROTOCOL.md` y el ejemplo
2. `scripts/tribunal/` — contiene el script del Ledger (opcional)
3. `LLM.md` y `AGENTS.md` — van en la raíz de tu proyecto

> **Nota:** Si tu proyecto ya tiene `.cursorrules` o `AGENTS.md`, no los sobreescribas. Agrega las líneas del puntero TRIBUNAL al archivo existente.

---

## Uso

### 1. Iniciar una auditoría

Copia la plantilla con el nombre adecuado:

```bash
cp docs/reviews/TEMPLATE.md docs/reviews/security-audit-20250715.md
```

Convenciones de nombrado:

| Tipo | Prefijo |
|:-----|:--------|
| Seguridad | `security-audit-` |
| Rendimiento | `perf-audit-` |
| Accesibilidad | `a11y-audit-` |
| Arquitectura | `arch-audit-` |
| Refactorización | `refactor-audit-` |

### 2. Ejecutar Fase 1 (Checker)

Pásale a una IA el archivo de auditoría vacío junto con el componente a revisar. Indícale su rol y alcance. Ejemplo de prompt:

```
Eres el Auditor (Checker) del TRIBUNAL Protocol.
Lee la plantilla en docs/reviews/security-audit-20250715.md.
Tu alcance: revisar XSS y CSRF en src/components/PaymentForm.tsx.
Rellena únicamente la Fase 1. No propongas implementaciones de código.
```

### 3. Ejecutar Fase 2 (Maker)

En una sesión o modelo **distinto**, pásale el archivo ya con la Fase 1 completada y el código fuente. Ejemplo:

```
Eres el Ejecutor (Maker) del TRIBUNAL Protocol.
Lee el reporte de auditoría en docs/reviews/security-audit-20250715.md.
Implementa los hallazgos que consideres válidos en el código fuente.
Rellena la Fase 2: tablas de cambios ejecutados, rechazados, parciales,
y hallazgos emergentes.
Todo rechazo requiere refutación técnica.
Si durante la implementación descubres problemas nuevos, documéntalos
como Hallazgos Emergentes (E-001, E-002...).
```

### 4. Ejecutar Fase 3 (Judge)

Invoca un modelo frontera con alto presupuesto de razonamiento. Pásale la bitácora y el diff del commit:

```
Eres el Juez (Judge) del TRIBUNAL Protocol.
Lee el archivo completo docs/reviews/security-audit-20250715.md.
Revisa también el diff del commit [hash/tag del Ejecutor].
Tu mandato: evaluar la calidad del Auditor y del Ejecutor.
No escribas código. Emite veredicto, puntuaciones y líneas rectoras.
```

### 5. Actualizar el Ledger (opcional, requiere Node.js)

```bash
node scripts/tribunal/update-reviews.js
```

Esto regenera `docs/reviews/README.md` con el índice actualizado. Para modo watch:

```bash
node scripts/tribunal/update-reviews.js --watch
```

---

## El Frontmatter YAML

Cada archivo de revisión lleva un bloque YAML que actúa como base de datos estructurada. El script del Ledger lee estos campos para generar el índice. Los campos están organizados en cuatro bloques:

```yaml
# Metadatos generales
schema_version: "1.1"
id: "security-PaymentForm-20250715-0930"
tipo: "security"                    # security | performance | accessibility | architecture | refactor
componente: "src/components/PaymentForm.tsx"
max_severity: "critical"            # Severidad más alta entre todos los hallazgos
status: "draft"                     # draft → audited → implemented → verified | rejected | escalated

# Fase 1
auditor:
  model: "qwen-3.6"
  session_id: "abc123"
  confidence: "high"

# Fase 2
executor:
  model: "claude-sonnet-4"
  commit_ref: "fix/xss-payment-20250716"
  accepted_count: 3
  rejected_count: 1
  emergent_count: 2

# Fase 3
judge:
  model: "claude-opus-4"
  verdict: "approved"               # approved | conditionally-approved | rejected | escalated
  auditor_score: 88
  executor_score: 92
  drift_detected: false
```

Consulta [`TEMPLATE.md`](docs/reviews/TEMPLATE.md) para la referencia completa de todos los campos.

---

## Flujo de Estados

```
draft → audited → implemented → verified
                               → rejected
                               → escalated
```

| Estado | Significado |
|:-------|:------------|
| `draft` | Plantilla copiada, ninguna fase iniciada |
| `audited` | Fase 1 completada — reporte del Checker listo |
| `implemented` | Fase 2 completada — código modificado + tabla de disposición |
| `verified` | Fase 3: Juez aprobó el ciclo |
| `rejected` | Fase 3: Juez rechazó — requiere nueva iteración |
| `escalated` | Fase 3: Juez escaló — requiere intervención humana o auditoría adicional |

---

## Guía de Selección de Modelos

TRIBUNAL es agnóstico al modelo, pero cada rol tiene necesidades distintas. Esta tabla es orientativa — los modelos evolucionan rápido:

| Rol | Qué necesita | Criterio clave | Ejemplos actuales |
|:----|:-------------|:---------------|:------------------|
| **Auditor** | Análisis técnico detallado, detectar patrones de vulnerabilidad | Conocimiento profundo del dominio (seguridad, rendimiento, a11y) | Claude Sonnet, GPT-4o, Qwen 3, Gemini 2.5 Pro |
| **Ejecutor** | Leer reporte + código, implementar cambios precisos, argumentar rechazos | Capacidad de edición de código + razonamiento para refutaciones | Claude Sonnet, GPT-4o, cualquier modelo con buen code editing |
| **Juez** | Evaluar la calidad de ambos agentes, detectar inconsistencias, visión global | Razonamiento largo, capacidad de análisis crítico, alto context window | Claude Opus, GPT-o1/o3, Gemini 2.5 Pro con thinking, DeepSeek R1 |

**Regla general:** El Juez debería ser el modelo más capaz disponible. El Auditor y el Ejecutor pueden ser modelos de rango medio siempre que tengan buen conocimiento del dominio auditado. Usar modelos pequeños o rápidos (Haiku, GPT-4o mini, Flash) para el Juez no es recomendable — su valor está en el análisis profundo.

---

## Integración CI/CD

El script del Ledger puede ejecutarse automáticamente. Ejemplo con un git hook:

```bash
# .git/hooks/post-commit
#!/bin/sh
node scripts/tribunal/update-reviews.js
git add docs/reviews/README.md
```

Ejemplo como GitHub Action:

```yaml
# .github/workflows/tribunal-ledger.yml
name: Update TRIBUNAL Ledger
on:
  push:
    paths:
      - 'docs/reviews/*.md'
jobs:
  update-ledger:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: node scripts/tribunal/update-reviews.js
      - uses: stefanzweifel/git-auto-commit-action@v5
        with:
          commit_message: "chore: update TRIBUNAL ledger"
          file_pattern: docs/reviews/README.md
```

---

## Reglas Cardinales

1. **Separación de contexto.** El Ejecutor no debe ser el mismo agente ni la misma sesión que el Auditor. Esta es la regla más importante del protocolo. Si se viola, todo el sistema pierde su razón de ser.

2. **Refutación obligatoria.** Todo hallazgo rechazado por el Ejecutor debe incluir una justificación técnica escrita y verificable. "No aplica" no es una refutación válida.

3. **El Juez no codifica.** Su rol es exclusivamente evaluativo y directivo. Recibe la bitácora y el diff, no el proyecto entero. Si necesita que se hagan cambios, los prescribe como líneas rectoras para una siguiente iteración.

4. **Trazabilidad total.** Cada fase registra el modelo utilizado, un identificador de sesión y un timestamp en el YAML. Esto permite auditar el proceso mismo.

5. **El README humano es sagrado.** El `README.md` raíz del proyecto es para humanos que quieren instalar o usar el software. Nunca se contamina con metadatos de QA. Todo vive dentro de `docs/reviews/`.

---

## Alcance y Limitaciones

**Qué es TRIBUNAL:** Un sistema de documentación y proceso para revisiones de código inter-agente. Define roles, formatos, convenciones y genera un registro auditable.

**Qué no es TRIBUNAL:** No es un linter, no ejecuta tests, no analiza código estáticamente, no reemplaza herramientas como ESLint, SonarQube o Lighthouse. TRIBUNAL orquesta agentes de IA que sí hacen ese análisis, y documenta sus conclusiones de forma estructurada.

---

## Preguntas Frecuentes

**¿Puedo usar el mismo modelo de IA para los 3 roles?**  
Sí, siempre que uses sesiones o conversaciones distintas para cada fase. Lo importante es la separación de contexto — que el Ejecutor no tenga el contexto mental del Auditor, y que el Juez evalúe sin haber participado en las fases anteriores. Dicho esto, usar modelos distintos da mejores resultados porque cada modelo tiene sesgos diferentes.

**¿Qué pasa si solo tengo acceso a un modelo?**  
Funciona. Abre tres sesiones/conversaciones separadas con el mismo modelo. Cada sesión solo ve lo que le corresponde a su fase. No copies contexto de una sesión a otra más allá de los archivos del protocolo.

**¿Necesito ejecutar las 3 fases siempre?**  
La Fase 1 y 2 son el mínimo funcional. La Fase 3 (Juez) es altamente recomendada para auditorías de seguridad y refactors críticos, pero puedes omitirla en revisiones de menor riesgo. El status quedaría en `implemented` sin llegar a `verified`.

**¿Qué hago si el Ejecutor rechaza todos los hallazgos?**  
Es válido si cada rechazo tiene refutación técnica sólida. El Juez en Fase 3 evaluará si los rechazos son legítimos o si el Ejecutor está evitando trabajo. Un patrón de rechazo total recurrente es una señal de que el Auditor necesita mejor calibración o que el scope de auditoría es inadecuado.

**¿Qué pasa si un agente ignora el protocolo y rellena secciones que no le tocan?**  
Descarta la salida y re-ejecuta la fase con instrucciones más explícitas. El prompt de ejemplo incluye la directiva del rol. Si el modelo persiste, usa uno diferente para esa fase.

**¿Cuánto cuesta en tokens una auditoría completa?**  
Depende del tamaño del componente y la cantidad de hallazgos. Como referencia, el ejemplo incluido (`security-audit-20250715.md`) con 4 hallazgos, tabla de disposición y veredicto completo ocupa ~3,500 tokens de salida sumando las tres fases. El costo de entrada depende del tamaño del código fuente que le pases al Auditor y al Ejecutor.

**¿El Juez necesita ver todo el código fuente del proyecto?**  
No. El Juez recibe la bitácora completa (que ya contiene ubicaciones, descripciones y decisiones) más el diff del commit del Ejecutor. Con eso puede evaluar si los cambios corresponden con lo documentado y si introducen problemas. No necesita contexto completo del proyecto.

---

## Contribuir

El protocolo está versionado (`schema_version` en el YAML) para permitir evolución sin romper el Ledger. Si quieres contribuir:

- **Nuevos tipos de auditoría** — Propón un nuevo prefijo de nombrado y, si necesita campos YAML adicionales, abre un issue describiendo el caso de uso.
- **Integraciones con IDEs** — Si usas una herramienta que lee un formato de configuración específico (como `.windsurfrules`, `.claude`, etc.), envía un PR con el archivo puntero correspondiente.
- **Mejoras al script del Ledger** — PRs bienvenidos. El script no debe adquirir dependencias externas; es zero-dependency por diseño.
- **Traducciones** — La plantilla y el protocolo están en español. Traducciones a otros idiomas son bienvenidas como archivos paralelos (`TEMPLATE.en.md`, `PROTOCOL.en.md`).

Para cambios al formato del frontmatter YAML o a las reglas del protocolo, abre un issue primero para discutir el impacto en compatibilidad.

---

## Licencia

MIT

---

<p align="center">
  <strong>TRIBUNAL Protocol v1.1</strong>
</p>
