# 🏛️ TRIBUNAL Protocol

**Agent-to-Agent Quality Assurance Framework for Code Repositories**

> *Ningún agente debe ser juez y parte de su propio código.*  
> *No agent should judge its own code.*

---

TRIBUNAL es un framework de proceso — no una librería, no un plugin, no un CLI. Es un conjunto de convenciones, plantillas y un script ligero que establece un sistema de revisión de código tripartito entre agentes de IA independientes. Se instala copiando archivos a tu repositorio. Funciona con cualquier lenguaje, cualquier framework, cualquier modelo de IA.

---

## El Problema

Los equipos que usan IA para programar enfrentan un patrón recurrente: le piden al mismo modelo que escriba código y luego lo audite. Esto produce **cámaras de eco**. La IA confirma sus propias decisiones, subestima los defectos que ella misma introdujo, y alucina correcciones que no resuelven problemas reales. Es el equivalente a que un empleado redacte su propia evaluación de desempeño.

TRIBUNAL resuelve esto separando el proceso en **tres roles ejecutados por agentes o sesiones distintas**, donde ninguno evalúa su propio trabajo.

---

## Cómo Funciona

El protocolo opera en tres fases secuenciales. Cada fase la ejecuta un agente de IA diferente (modelo distinto, sesión distinta, o ambas). El artefacto central es un único archivo Markdown con frontmatter YAML que viaja por las tres fases, acumulando información.

```
  Fase 1                    Fase 2                     Fase 3
┌──────────────┐         ┌──────────────┐          ┌──────────────┐
│   CHECKER    │         │    MAKER     │          │    JUDGE     │
│   (Auditor)  │────────▸│  (Ejecutor)  │─────────▸│    (Juez)    │
│              │ Reporte │              │ Código + │              │
│  Escanea el  │   de    │  Lee reporte │ Tabla de │  Evalúa a   │
│  código sin  │hallazgos│  e implementa│Disposici.│  ambos y    │
│  contexto    │         │  o rechaza   │          │  emite      │
│  previo      │         │  con argumen.│          │  veredicto  │
└──────────────┘         └──────────────┘          └──────────────┘
   IA/Sesión A              IA/Sesión B              Modelo Frontera
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

Un modelo frontera con alto presupuesto de razonamiento. Su mandato es exclusivamente evaluativo — **no escribe código**. Lee las bitácoras completas (reporte + tabla de disposición) y emite:

- Puntuaciones numéricas (0–100) para el Auditor y el Ejecutor
- Un veredicto formal: `approved`, `conditionally-approved`, `rejected`, o `escalated`
- Un diagnóstico que responde: ¿Hubo falsos positivos que presionaron al Ejecutor? ¿El Ejecutor rompió funcionalidad al implementar? ¿Se detectó desviación arquitectónica? ¿Los hallazgos emergentes revelan puntos ciegos del Auditor?
- Líneas rectoras correctivas para futuras iteraciones del proyecto

El `status` pasa a `verified`, `rejected`, o `escalated`.

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

El único requisito técnico es **Node.js ≥ 16** para ejecutar el script opcional del Ledger (índice auto-generado). El protocolo en sí — las plantillas, los roles, el flujo de estados — funciona sin ninguna dependencia: son archivos Markdown planos.

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
│       └── security-audit-20250715.md   # Ejemplo funcional completo
│
└── scripts/
    └── tribunal/
        └── update-reviews.js            # Genera el Ledger desde frontmatter YAML
```

### Descripción de cada archivo

**`TEMPLATE.md`** — El corazón del framework. Es la plantilla que se copia para cada nueva revisión. Contiene un frontmatter YAML de ~40 campos estructurados en cuatro bloques (metadatos generales, auditor, ejecutor, juez) y el cuerpo Markdown con las secciones que cada fase debe rellenar. Nunca se edita directamente; se copia con el nombre del tipo de auditoría y fecha.

**`PROTOCOL.md`** — Documentación completa del proceso para referencia humana y de agentes. Describe los roles, las reglas, las convenciones de nombrado y el flujo de estados.

**`LLM.md`** — Un archivo breve en la raíz del proyecto que actúa como puntero universal. Cuando una IA recibe el repositorio completo (en un chat web, por API, o cualquier otro medio), este archivo le indica que existe un protocolo de QA y le señala dónde leer la plantilla obligatoria. No contiene reglas — solo apunta.

**`AGENTS.md`** — Mismo propósito que `LLM.md`, pero en el formato que reconocen herramientas como Cline, Windsurf y OpenCode.

**`.cursorrules`** — Mismo propósito, en formato JSON para Cursor IDE.

**`update-reviews.js`** — Script de Node.js sin dependencias externas. Lee el frontmatter YAML de todos los archivos `.md` en `docs/reviews/`, extrae los campos clave (tipo, modelos, estado, veredicto) y genera un `README.md` dinámico dentro de esa misma carpeta. Este README es "The Ledger": un índice cronológico con badges de estado que permite ver de un vistazo el historial completo de revisiones del proyecto.

**`security-audit-20250715.md`** — Un ejemplo funcional con los tres roles completados, para que puedas ver cómo luce un ciclo terminado.

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
cp tribunal-protocol/.cursorrules tu-proyecto/
```

### Opción B — Copiar manualmente

Copia la carpeta `docs/reviews/` (con `TEMPLATE.md` y `PROTOCOL.md`), la carpeta `scripts/tribunal/`, y los archivos puntero (`LLM.md`, `AGENTS.md`, `.cursorrules`) a tu repositorio. Eso es todo.

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
Rellena la Fase 2: tablas de cambios ejecutados, rechazados, parciales, y hallazgos emergentes.
Todo rechazo requiere refutación técnica.
Si durante la implementación descubres problemas nuevos, documéntalos como Hallazgos Emergentes (E-001, E-002...).
```

### 4. Ejecutar Fase 3 (Judge)

Invoca un modelo frontera con alto presupuesto de razonamiento. No le des acceso al código — solo la bitácora:

```
Eres el Juez (Judge) del TRIBUNAL Protocol.
Lee el archivo completo docs/reviews/security-audit-20250715.md.
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
schema_version: "1.0"
id: "security-PaymentForm-20250715-0930"
tipo: "security"                    # security | performance | accessibility | architecture | refactor
componente: "src/components/PaymentForm.tsx"
severity: "high"                    # critical | high | medium | low
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

Consulta `TEMPLATE.md` para la referencia completa de todos los campos.

---

## Flujo de Estados

```
         ┌─────────┐
         │  draft   │  Plantilla copiada, sin iniciar
         └────┬─────┘
              │ Fase 1 completada
              ▼
         ┌─────────┐
         │ audited  │  Reporte del Checker listo
         └────┬─────┘
              │ Fase 2 completada
              ▼
       ┌──────────────┐
       │ implemented   │  Código modificado + Tabla de Disposición
       └──────┬───────┘
              │ Fase 3 completada
              ▼
    ┌─────────┴──────────┬──────────────┐
    ▼                    ▼              ▼
┌──────────┐   ┌───────────┐   ┌────────────┐
│ verified │   │ rejected  │   │ escalated  │
└──────────┘   └───────────┘   └────────────┘
```

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

3. **El Juez no codifica.** Su rol es exclusivamente evaluativo y directivo. Si el Juez necesita que se hagan cambios, los prescribe como líneas rectoras para una siguiente iteración.

4. **Trazabilidad total.** Cada fase registra el modelo utilizado, un identificador de sesión y un timestamp en el YAML. Esto permite auditar el proceso mismo.

5. **El README humano es sagrado.** El `README.md` raíz del proyecto es para humanos que quieren instalar o usar el software. Nunca se contamina con metadatos de QA. Todo vive dentro de `docs/reviews/`.

---

## Alcance y Limitaciones

**Qué es TRIBUNAL:**
Un sistema de documentación y proceso para revisiones de código inter-agente. Define roles, formatos, convenciones y genera un registro auditable.

**Qué no es TRIBUNAL:**
No es un linter, no ejecuta tests, no analiza código estáticamente, no reemplaza herramientas como ESLint, SonarQube o Lighthouse. TRIBUNAL orquesta agentes de IA que sí hacen ese análisis, y documenta sus conclusiones de forma estructurada.

**Dependencias:**
Ninguna. El protocolo son archivos Markdown planos. Opcionalmente, Node.js ≥ 16 para ejecutar el script del Ledger que genera el índice automático — pero el Ledger es conveniencia, no requisito. Si no tienes Node, el framework sigue funcionando; simplemente mantienes el índice manualmente o lo omites.

---

## Contribuir

Si quieres extender el protocolo (nuevos tipos de auditoría, integraciones con más IDEs, scripts adicionales), abre un issue o pull request. El formato del frontmatter YAML es versionado (`schema_version`) para permitir evolución sin romper el Ledger.

---

## Licencia

MIT

---

<p align="center">
  <strong>TRIBUNAL Protocol v1.1</strong><br>
  <em>Tripartite Review by Independent Brainstorming Under Networked AI Layers</em>
</p>
