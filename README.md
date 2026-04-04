# 🏛️ TRIBUNAL Protocol

**Framework de Quality Assurance entre Agentes de IA para Repositorios de Código**

> *Ningún agente debe ser juez y parte de su propio código.*

---

TRIBUNAL es un framework de proceso — no una librería, no un plugin, no un CLI. Es un conjunto de convenciones, plantillas y un script ligero que establece un sistema de revisión de código entre agentes de IA independientes. Se instala copiando archivos a tu repositorio. Funciona con cualquier lenguaje, cualquier framework, cualquier modelo de IA.

---

## Inicio Rápido

```bash
# 1. Copia los archivos a tu proyecto
cp -r tribunal-protocol/docs/reviews/ tu-proyecto/docs/reviews/
cp -r tribunal-protocol/scripts/tribunal/ tu-proyecto/scripts/tribunal/
cp tribunal-protocol/LLM.md tu-proyecto/

# 2. Crea una auditoría a partir de la plantilla
cp docs/reviews/TEMPLATE.md docs/reviews/security-audit-20250715.md

# 3. Pásale el archivo a una IA como Auditor → Fase 1
# 4. Pásale el resultado a otra IA/sesión como Ejecutor → Fase 2
```

**[→ Ver un ejemplo completo](docs/reviews/security-audit-20250715.md)**

---

## El Problema

Los equipos que usan IA para programar enfrentan un patrón recurrente: le piden al mismo modelo que escriba código y luego lo audite. Esto produce **cámaras de eco**. La IA confirma sus propias decisiones, subestima los defectos que ella misma introdujo, y alucina correcciones que no resuelven problemas reales.

TRIBUNAL resuelve esto separando el proceso en **roles ejecutados por agentes o sesiones distintas**, donde ninguno evalúa su propio trabajo.

---

## Cómo Funciona

TRIBUNAL opera en dos niveles: un **flujo operativo** que se usa en cada auditoría, y una **capa de gobernanza** que se activa periódicamente.

### Flujo Operativo — Checker → Maker

El ciclo estándar de toda auditoría. Dos roles, dos agentes o sesiones distintas, un artefacto Markdown compartido.

```
┌────────────────┐                ┌────────────────┐
│    CHECKER      │    Reporte    │     MAKER       │
│   (Auditor)     │──────────────▸│   (Ejecutor)    │
│                 │  de hallazgos │                  │
│  Analiza código │               │  Implementa o   │
│  crudo, produce │               │  rechaza con     │
│  hallazgos      │               │  justificación,  │
│  verificables   │               │  valida cambios  │
└────────────────┘                └────────────────┘
   IA / Sesión A                    IA / Sesión B
```

**El Checker** recibe un componente y una mira concreta (seguridad, rendimiento, accesibilidad, arquitectura). Analiza el código sin contexto previo y produce hallazgos numerados (`F-001`, `F-002`...) con severidad, evidencia reproducible y sugerencia de remediación.

**El Maker** lee el reporte completo junto con el código fuente. Para cada hallazgo, decide: implementar, implementar con variación, o rechazar con refutación técnica argumentada. Modifica el código, valida que sus cambios funcionan, y documenta todo en la bitácora.

Este ciclo puede repetirse múltiples veces dentro del proyecto. Es autocontenido — no requiere aprobación externa para considerarse cerrado.

### Gobernanza Periódica — El Judge

El Judge no forma parte del flujo operativo diario. Se ejecuta de forma ocasional (cada 5–10 auditorías, o ante auditorías de alto riesgo) para evaluar **el proceso**, no solo un caso individual.

```
┌──────────────────────────────────────────────┐
│                    JUDGE                      │
│                   (Juez)                      │
│                                               │
│  Revisa un lote de auditorías completadas     │
│  Evalúa la calidad del Checker y del Maker    │
│  Detecta patrones, sesgos, drift              │
│  Emite líneas rectoras para futuras sesiones  │
└──────────────────────────────────────────────┘
                 Modelo Frontera
```

Su valor está en detectar patrones que una sola auditoría no revela: ¿el Auditor sobreestima severidades? ¿el Ejecutor rechaza sistemáticamente cierto tipo de hallazgo? ¿hay desviación arquitectónica acumulada?

El Juez no revierte trabajo ya validado. Si encuentra problemas graves, recomienda abrir un nuevo ciclo Checker → Maker.

---

## Flujo de Estados

```
draft → audited → validated → reviewed
                → blocked   → reviewed
```

| Estado | Significado |
|:-------|:------------|
| `draft` | Plantilla copiada, ninguna fase iniciada |
| `audited` | Reporte del Checker listo |
| `validated` | Maker implementó cambios y pasó el gate de validación |
| `blocked` | Maker no pudo completar — gate falla o hay problemas irresolubles |
| `reviewed` | El Judge revisó esta auditoría como parte de su evaluación periódica |

`validated` es el estado terminal operativo exitoso. Una auditoría no necesita llegar a `reviewed` para considerarse cerrada.

---

## Reglas por Rol

### Checker (Auditor)

**Mandato:** Analizar código crudo sin contexto previo y producir un reporte de hallazgos verificables.

El Checker recibe un componente específico y una mira concreta. No ve soluciones previas ni tiene contexto de decisiones pasadas. Produce hallazgos numerados (`F-001`, `F-002`...) con estructura obligatoria: descripción clara, archivo y línea exacta, severidad, evidencia reproducible y sugerencia de remediación.

**Reglas:**

- No propone implementaciones completas de código — su rol es diagnóstico, no prescriptivo. Puede sugerir dirección de remediación pero el "cómo" le corresponde al Ejecutor.
- No asume contexto de decisiones previas del sistema. Analiza lo que ve, no lo que cree que debería haber.
- Diferencia severidad con rigor: **crítica** (explotable ahora, con vector demostrable), **alta** (potencial real pero requiere condiciones), **media** (mejora técnica con impacto medible), **baja** (cosmético o convención). Inflar severidades erosiona la credibilidad del reporte y presiona al Ejecutor a priorizar mal.
- Verifica que el hallazgo no esté ya corregido. Reportar bugs resueltos desperdicia el tiempo del Ejecutor y contamina la bitácora.
- Busca problemas de integridad estructural: bloques duplicados, imports rotos, syntax errors. Estos son hallazgos tan válidos como los del dominio auditado.

Al terminar, el `status` pasa de `draft` a `audited`.

### Maker (Ejecutor)

**Mandato:** Leer el reporte del Auditor, decidir sobre cada hallazgo, implementar los cambios en el código, y validar que el resultado es funcional.

Para cada hallazgo decide una de tres acciones: implementar tal cual, implementar con variación, o rechazar. Modifica el código fuente y rellena cuatro tablas obligatorias en la bitácora: Cambios Ejecutados, Cambios Rechazados, Cambios Parciales, Hallazgos Emergentes.

**Reglas:**

- Todo rechazo incluye refutación técnica argumentada y verificable. "No aplica" sin justificación no es una refutación válida. Debe demostrar *por qué* el hallazgo es incorrecto, no solo declarar que lo es.
- Si descubre problemas nuevos durante la implementación, los documenta como Hallazgos Emergentes (`E-001`, `E-002`...). No corrige silenciosamente — todo queda en la bitácora.
- Verifica integridad estructural después de cada edición. La duplicación de bloques de código es el error más frecuente y destructivo en implementaciones asistidas por IA. Antes de avanzar al siguiente hallazgo, confirma que no introdujo duplicaciones.
- **Implementación por oleadas.** Cuando el reporte contiene múltiples hallazgos, no los implementa todos de una vez. Los agrupa por área temática o por archivos que afectan, implementa un grupo, valida, confirma integridad, y solo entonces pasa al siguiente. El tamaño de cada grupo depende de la complejidad — la referencia es que un grupo no debe tocar tantos archivos simultáneamente que la verificación se vuelva inmanejable. Si un hallazgo individual requiere editar muchos archivos, se trata como grupo completo.
- Un commit por hallazgo o grupo coherente de hallazgos relacionados. Facilita revertir si algo sale mal.

**Gate de validación:**

Ningún hallazgo puede marcarse como implementado sin haber pasado validación. El Ejecutor valida sus cambios con los mecanismos disponibles en el proyecto: build, tests automatizados, linters, type checks, o lo que exista. Si el proyecto no tiene ninguno, al mínimo verifica que no haya errores de sintaxis.

Documenta en la bitácora: qué validaciones ejecutó, el resultado de cada una, y cualquier anomalía detectada.

Si un cambio rompe el build, falla tests existentes, o introduce errores nuevos, no puede marcarse como implementado. Debe registrarse como cambio parcial o hallazgo emergente.

Al terminar: si la validación pasa, el `status` pasa a `validated`. Si no pasa y no puede resolverlo, el `status` pasa a `blocked`.

### Judge (Juez)

**Mandato:** Evaluar la calidad del Auditor y del Ejecutor a lo largo de múltiples auditorías, detectar patrones y emitir directrices correctivas.

No forma parte del flujo operativo diario. Se ejecuta periódicamente para evaluar el proceso. Recibe las bitácoras completas y los diffs de las auditorías que revisa.

**Reglas:**

- No escribe ni modifica código bajo ninguna circunstancia. Su rol es exclusivamente evaluativo y directivo. Si encuentra problemas, los prescribe como líneas rectoras para un nuevo ciclo Checker → Maker.
- No revierte trabajo ya validado. Si encuentra problemas en una auditoría `validated`, documenta sus observaciones y, si es grave, recomienda abrir un nuevo ciclo.
- Basa su evaluación en la bitácora completa y el diff del código. No necesita el código fuente completo del proyecto.
- Emite por auditoría: puntuaciones (0–100) para Auditor y Ejecutor, diagnóstico (¿hubo falsos positivos? ¿el diff introduce regresiones? ¿los rechazos son legítimos? ¿los emergentes revelan puntos ciegos?).
- Emite a nivel global: patrones detectados, desviaciones arquitectónicas acumuladas, líneas rectoras accionables.

Al revisar, el `status` de cada auditoría evaluada pasa a `reviewed`.

### Regla Fundamental

Ningún agente evalúa su propio trabajo. El Checker no implementa. El Maker no audita su propio output. El Judge no participa en las fases operativas. Si esta separación se viola, el protocolo pierde su razón de ser.

---

## El Frontmatter YAML

Cada archivo de revisión lleva un bloque YAML que actúa como base de datos estructurada. Los campos están organizados en cuatro bloques:

```yaml
# Metadatos generales
schema_version: "2.0"
id: "security-PaymentForm-20250715-0930"
tipo: "security"                          # security | performance | accessibility | architecture | refactor
componente: "src/components/PaymentForm.tsx"
alcance: "XSS y CSRF en formulario de pago"
max_severity: ""                          # critical | high | medium | low
status: "draft"                           # draft → audited → validated | blocked → reviewed
created_at: ""

# Checker
auditor:
  model: ""
  session_id: ""
  timestamp: ""
  findings_count: 0
  confidence: ""                          # high | medium | low

# Maker
executor:
  model: ""
  session_id: ""
  timestamp: ""
  commit_ref: ""
  accepted_count: 0
  rejected_count: 0
  partial_count: 0
  emergent_count: 0
  waves_count: 0
  validation:
    tools_used: []                        # ["build", "tests", "linter", "typecheck"]
    result: ""                            # pass | fail
    notes: ""

# Judge (se llena cuando el Juez revisa esta auditoría)
judge:
  model: ""
  session_id: ""
  timestamp: ""
  review_batch: ""                        # ID del lote: "batch-2025Q3-001"
  auditor_score: null                     # 0-100
  executor_score: null                    # 0-100
  verdict: ""                             # reviewed-ok | reviewed-issues | reviewed-escalated
  drift_detected: false
  new_audit_recommended: false
  notes: ""
```

Consulta [`TEMPLATE.md`](docs/reviews/TEMPLATE.md) para la referencia completa.

---

## Agnóstico por Diseño

| Dimensión | TRIBUNAL es compatible con... |
|:----------|:------------------------------|
| **Lenguaje** | Cualquiera. El objeto de auditoría es código fuente en cualquier lenguaje. |
| **Framework** | React, Vue, Django, Rails, Spring, FastAPI, o código sin framework. |
| **Modelo de IA** | Claude, GPT, Gemini, Qwen, Llama, Mistral, DeepSeek, o cualquier LLM. |
| **IDE / Herramienta** | Cursor, Windsurf, Cline, OpenCode, Claude Code, chat web, API directa, o terminal. |
| **Hosting** | GitHub, GitLab, Bitbucket, o cualquier repositorio Git. |

**Dependencias:** Ninguna. El protocolo son archivos Markdown planos. Opcionalmente, Node.js ≥ 16 para el script del Ledger (índice auto-generado).

---

## Cuándo Usar TRIBUNAL

TRIBUNAL está diseñado para auditorías puntuales y profundas, no para cada commit trivial. Úsalo cuando un componente maneja datos sensibles, estás haciendo un refactor arquitectónico, un módulo tiene problemas de rendimiento, necesitas una auditoría de accesibilidad, o sospechas que tu IA está confirmando sus propios errores.

No es necesario para cambios cosméticos, actualizaciones de dependencias rutinarias, o features triviales donde el riesgo es bajo.

---

## Estructura del Repositorio

```
tribunal-protocol/
├── LLM.md                              # Puntero raíz para cualquier IA
├── AGENTS.md                            # Puntero para Cline, Windsurf, OpenCode
├── .cursorrules                         # Puntero para Cursor IDE
├── docs/
│   └── reviews/
│       ├── PROTOCOL.md                  # Documentación completa del proceso
│       ├── TEMPLATE.md                  # Plantilla base con YAML de los 3 roles
│       ├── README.md                    # The Ledger (índice auto-generado)
│       └── security-audit-20250715.md   # Ejemplo completo
└── scripts/
    └── tribunal/
        └── update-reviews.js            # Genera el Ledger (opcional, Node.js)
```

---

## Uso

### 1. Crear una auditoría

```bash
cp docs/reviews/TEMPLATE.md docs/reviews/security-audit-20250715.md
```

Convenciones de nombrado: `security-audit-`, `perf-audit-`, `a11y-audit-`, `arch-audit-`, `refactor-audit-`.

### 2. Ejecutar el Checker (Fase 1)

Pásale a una IA el archivo de auditoría vacío junto con el componente a revisar:

```
Eres el Auditor (Checker) del TRIBUNAL Protocol.
Lee la plantilla en docs/reviews/security-audit-20250715.md.
Tu alcance: revisar XSS y CSRF en src/components/PaymentForm.tsx.
Rellena únicamente la Fase 1. No propongas implementaciones de código.
```

### 3. Ejecutar el Maker (Fase 2)

En una sesión o modelo **distinto**, pásale el archivo con la Fase 1 completada y el código fuente:

```
Eres el Ejecutor (Maker) del TRIBUNAL Protocol.
Lee el reporte en docs/reviews/security-audit-20250715.md.
Implementa los hallazgos válidos. Rellena la Fase 2.
Todo rechazo requiere refutación técnica.
Documenta hallazgos emergentes si los encuentras.
Valida tus cambios antes de declarar implementado.
```

### 4. Ejecutar el Judge (periódico)

Cuando tengas varias auditorías completadas, invoca un modelo frontera:

```
Eres el Juez (Judge) del TRIBUNAL Protocol.
Revisa las siguientes auditorías completadas: [lista de archivos].
Evalúa la calidad del Auditor y del Ejecutor.
Detecta patrones, sesgos y desviaciones.
No escribas código. Emite veredicto, puntuaciones y líneas rectoras.
```

### 5. Actualizar el Ledger (opcional)

```bash
node scripts/tribunal/update-reviews.js
```

---

## Guía de Selección de Modelos

Cada rol tiene necesidades distintas. Esta tabla es orientativa:

| Rol | Qué necesita | Criterio clave |
|:----|:-------------|:---------------|
| **Checker** | Análisis técnico detallado, detectar patrones de vulnerabilidad | Conocimiento profundo del dominio auditado |
| **Maker** | Leer reporte + código, implementar cambios precisos, argumentar rechazos | Precisión de edición de código + razonamiento para refutaciones |
| **Judge** | Evaluar calidad de ambos agentes, detectar inconsistencias, visión global | Razonamiento largo, análisis crítico, alto context window |

El Judge debería ser el modelo más capaz disponible. El Checker y el Maker pueden ser modelos de rango medio con buen conocimiento del dominio. No se recomienda usar modelos pequeños o rápidos para el Judge.

---

## Glosario

| Término | Descripción |
|:--------|:------------|
| **Checker** | La IA que escanea y reporta hallazgos (Fase 1) |
| **Maker** | La IA que implementa o rechaza hallazgos (Fase 2) |
| **Judge** | La IA que evalúa el proceso periódicamente |
| **Ledger** | Índice auto-generado de todas las revisiones |
| **Hallazgo** (`F-001`...) | Problema encontrado por el Checker |
| **Emergente** (`E-001`...) | Problema encontrado por el Maker durante implementación |
| **Bitácora** | El archivo `.md` completo con las fases rellenadas |

---

## Preguntas Frecuentes

**¿Puedo usar el mismo modelo para Checker y Maker?**
Sí, siempre que uses sesiones distintas. Lo importante es la separación de contexto. Usar modelos distintos da mejores resultados porque cada uno tiene sesgos diferentes.

**¿Necesito ejecutar el Judge siempre?**
No. El flujo Checker → Maker es autocontenido. El Judge es altamente recomendado para auditorías de seguridad y cuando acumulas varias revisiones, pero puedes omitirlo en revisiones de menor riesgo.

**¿Qué hago si el Maker rechaza todos los hallazgos?**
Es válido si cada rechazo tiene refutación técnica sólida. Si usas al Judge, este evaluará si los rechazos son legítimos. Un patrón de rechazo total recurrente indica que el Checker necesita mejor calibración o que el alcance es inadecuado.

**¿Qué pasa si un agente ignora el protocolo?**
Descarta la salida y re-ejecuta con instrucciones más explícitas. Si persiste, usa un modelo diferente para ese rol.

**¿El Judge necesita todo el código fuente?**
No. Recibe las bitácoras completas y los diffs. Con eso evalúa si los cambios corresponden con lo documentado y detecta patrones entre auditorías.

---

## Contribuir

El protocolo está versionado (`schema_version` en el YAML). Para contribuir: nuevos tipos de auditoría, integraciones con IDEs, mejoras al Ledger (sin dependencias externas), o traducciones como archivos paralelos (`TEMPLATE.en.md`, `PROTOCOL.en.md`). Para cambios al YAML o las reglas, abre un issue primero.

---

## Licencia

MIT

---

<p align="center">
  <strong>TRIBUNAL Protocol v2.0</strong>
</p>
