# 🏛️ TRIBUNAL Protocol

### Agent-to-Agent Quality Assurance Framework v2.0

> *"Ningún agente debe ser juez y parte de su propio código."*

---

## ¿Qué es TRIBUNAL?

**TRIBUNAL** es un framework agnóstico de control de calidad inter-agentes para repositorios de código. Rompe la cámara de eco donde una sola IA programa y audita simultáneamente, reemplazándola con un sistema de roles independientes donde ningún agente evalúa su propio trabajo.

## El Problema

Cuando una IA genera código y se le pide revisarlo en la misma sesión, tiende a confirmar sus propias decisiones, alucinar correcciones que no abordan problemas reales, subestimar defectos que ella misma introdujo, y crear cámaras de eco donde el "auditor" y el "programador" comparten el mismo contexto contaminado.

## Modelo de Ejecución

TRIBUNAL opera en dos niveles distintos:

### Flujo Operativo — Checker → Maker

El ciclo estándar de toda auditoría. Dos roles, dos agentes o sesiones distintas, un artefacto Markdown compartido. Este ciclo es autocontenido y puede repetirse múltiples veces dentro del proyecto.

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

### Gobernanza Periódica — El Judge

El Judge no forma parte del flujo operativo diario. Se ejecuta de forma ocasional (cada 5–10 auditorías, o ante auditorías de alto riesgo) para evaluar el proceso, no solo un caso individual.

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

Su valor está en detectar patrones que una sola auditoría no revela: ¿el Checker sobreestima severidades? ¿el Maker rechaza sistemáticamente cierto tipo de hallazgo? ¿hay desviación arquitectónica acumulada? El Judge no revierte trabajo ya validado. Si encuentra problemas graves, recomienda abrir un nuevo ciclo Checker → Maker.

---

## Reglas por Rol

### Checker (Auditor)

**Mandato:** Analizar código crudo sin contexto previo y producir un reporte de hallazgos verificables.

El Checker recibe un componente específico y una mira concreta (seguridad, rendimiento, accesibilidad, arquitectura). No ve soluciones previas ni tiene contexto de decisiones pasadas. Produce hallazgos numerados (`F-001`, `F-002`...) con estructura obligatoria: descripción clara, archivo y línea exacta, severidad, evidencia reproducible y sugerencia de remediación.

**Reglas:**

- No propone implementaciones completas de código — su rol es diagnóstico, no prescriptivo. Puede sugerir dirección de remediación pero el "cómo" le corresponde al Maker.
- No asume contexto de decisiones previas del sistema. Analiza lo que ve, no lo que cree que debería haber.
- Diferencia severidad con rigor: **crítica** (explotable ahora, con vector demostrable), **alta** (potencial real pero requiere condiciones), **media** (mejora técnica con impacto medible), **baja** (cosmético o convención). Inflar severidades erosiona la credibilidad del reporte y presiona al Maker a priorizar mal.
- Verifica que el hallazgo no esté ya corregido. Reportar bugs resueltos desperdicia el tiempo del Maker y contamina la bitácora.
- Busca problemas de integridad estructural: bloques duplicados, imports rotos, syntax errors. Estos son hallazgos tan válidos como los del dominio auditado.

**Produce:** Reporte exhaustivo con hallazgos numerados y sugerencias de remediación.
**Archivo:** `docs/reviews/[tipo]-audit-[YYYYMMDD].md` (copia de `TEMPLATE.md`).
**Estado YAML al terminar:** `status: audited`.

### Maker (Ejecutor)

**Mandato:** Leer el reporte del Checker, decidir sobre cada hallazgo, implementar los cambios en el código, y validar que el resultado es funcional.

Para cada hallazgo decide una de tres acciones: implementar tal cual, implementar con variación, o rechazar. Modifica el código fuente y rellena cuatro tablas obligatorias en la bitácora: Cambios Ejecutados, Cambios Rechazados, Cambios Parciales, Hallazgos Emergentes.

**Reglas:**

- Todo rechazo incluye refutación técnica argumentada y verificable. "No aplica" sin justificación no es una refutación válida. Debe demostrar *por qué* el hallazgo es incorrecto, no solo declarar que lo es.
- Si descubre problemas nuevos durante la implementación, los documenta como Hallazgos Emergentes (`E-001`, `E-002`...). No corrige silenciosamente — todo queda en la bitácora.
- Verifica integridad estructural después de cada edición. La duplicación de bloques de código es el error más frecuente y destructivo en implementaciones asistidas por IA. Antes de avanzar al siguiente hallazgo, confirma que no introdujo duplicaciones.
- **Implementación por oleadas.** Cuando el reporte contiene múltiples hallazgos, no los implementa todos de una vez. Los agrupa por área temática o por archivos que afectan, implementa un grupo, valida, confirma integridad, y solo entonces pasa al siguiente. El tamaño de cada grupo depende de la complejidad — la referencia es que un grupo no debe tocar tantos archivos simultáneamente que la verificación se vuelva inmanejable. Si un hallazgo individual requiere editar muchos archivos, se trata como grupo completo.
- Un commit por hallazgo o grupo coherente de hallazgos relacionados. Facilita revertir si algo sale mal.

**Gate de validación:**

Ningún hallazgo puede marcarse como implementado sin haber pasado validación. El Maker valida sus cambios con los mecanismos disponibles en el proyecto: build, tests automatizados, linters, type checks, o lo que exista. Si el proyecto no tiene ninguno, al mínimo verifica que no haya errores de sintaxis.

Documenta en la bitácora: qué validaciones ejecutó, el resultado de cada una, y cualquier anomalía detectada. La sección "Registro de Validación" en el TEMPLATE.md tiene la tabla para esta evidencia.

Si un cambio rompe el build, falla tests existentes, o introduce errores nuevos, no puede marcarse como implementado. Debe registrarse como cambio parcial o hallazgo emergente.

**Produce:** Cambios en el código fuente + Tabla de Disposición + Registro de Validación.
**Commit tag:** Referenciado en `executor.commit_ref`.
**Estado YAML al terminar:** `status: validated` (si el gate pasa) o `status: blocked` (si no pasa y no puede resolverlo).

### Judge (Juez)

**Mandato:** Evaluar la calidad del Checker y del Maker a lo largo de múltiples auditorías, detectar patrones y emitir directrices correctivas.

No forma parte del flujo operativo diario. Se ejecuta periódicamente para evaluar el proceso. Recibe las bitácoras completas y los diffs de las auditorías que revisa.

**Reglas:**

- No escribe ni modifica código bajo ninguna circunstancia. Su rol es exclusivamente evaluativo y directivo. Si encuentra problemas, los prescribe como líneas rectoras para un nuevo ciclo Checker → Maker.
- No revierte trabajo ya validado. Si encuentra problemas en una auditoría `validated`, documenta sus observaciones y, si es grave, recomienda abrir un nuevo ciclo (marcando `new_audit_recommended: true` en el YAML).
- Basa su evaluación en la bitácora completa y el diff del código. No necesita el código fuente completo del proyecto.
- Emite por auditoría: puntuaciones (0–100) para Checker y Maker, diagnóstico respondiendo las preguntas guía del TEMPLATE.md.
- Emite a nivel global: patrones detectados entre auditorías, desviaciones arquitectónicas acumuladas, líneas rectoras accionables.

**Produce:** Calificaciones, veredicto por auditoría, diagnóstico de patrones, líneas rectoras.
**Veredicto:** `reviewed-ok` | `reviewed-issues` | `reviewed-escalated`.
**Estado YAML al terminar:** `status: reviewed`.

### Regla Fundamental

Ningún agente evalúa su propio trabajo. El Checker no implementa. El Maker no audita su propio output. El Judge no participa en las fases operativas. Si esta separación se viola, el protocolo pierde su razón de ser.

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

## Estructura de Archivos

```
proyecto/
├── LLM.md                          # Puntero raíz para IAs
├── AGENTS.md                        # Puntero para Cline/Windsurf/OpenCode
├── .cursorrules                     # Puntero para Cursor IDE
├── docs/
│   └── reviews/
│       ├── PROTOCOL.md              # Este documento
│       ├── TEMPLATE.md              # Plantilla base (no editar directamente)
│       ├── README.md                # Índice auto-generado (The Ledger)
│       ├── security-audit-20250715.md
│       ├── perf-audit-20250720.md
│       └── ...
└── scripts/
    └── tribunal/
        └── update-reviews.js        # Script que genera el Ledger
```

## Convenciones de Nombrado

| Tipo de Auditoría | Prefijo del archivo | Ejemplo |
|:------------------|:-------------------|:--------|
| Seguridad         | `security-audit-`  | `security-audit-20250715.md` |
| Rendimiento       | `perf-audit-`      | `perf-audit-20250720.md` |
| Accesibilidad     | `a11y-audit-`      | `a11y-audit-20250801.md` |
| Arquitectura      | `arch-audit-`      | `arch-audit-20250810.md` |
| Refactorización   | `refactor-audit-`  | `refactor-audit-20250815.md` |

---

## Documentación Complementaria

TRIBUNAL cubre la revisión de calidad del código, no la gestión del proyecto. Sin embargo, muchos equipos mantienen documentos de planificación y progreso que complementan el proceso de auditoría. TRIBUNAL no prescribe formato ni estructura para estos documentos, pero recomienda dos prácticas si los usas:

**Archivo de progreso** (ej. `PROGRESS.md`). Si el proyecto mantiene un registro cronológico de cambios y decisiones técnicas, las sesiones que involucren una auditoría TRIBUNAL no deben duplicar el contenido de la bitácora. En su lugar, PROGRESS.md referencia la auditoría con un enlace y un resumen breve:

```markdown
## Sesión 2025-07-16 — Auditoría de seguridad PaymentForm

Se ejecutó ciclo TRIBUNAL (Checker → Maker). 4 hallazgos, 3 implementados, 1 rechazado.
Validación: build + tests passing.
Bitácora: [docs/reviews/security-audit-20250715.md](docs/reviews/security-audit-20250715.md)
```

**Archivo de planificación** (ej. `ROADMAP.md`). Si el proyecto tiene un roadmap o plan de hitos, el Judge puede consultarlo como contexto durante su evaluación periódica para detectar desviaciones arquitectónicas respecto a la dirección planificada del proyecto. No es un input obligatorio — es contexto adicional que mejora la calidad del diagnóstico.

---

## El Ledger (Índice Automatizado)

El script `scripts/tribunal/update-reviews.js` lee los campos YAML de cada archivo en `docs/reviews/` y genera un `README.md` dinámico ordenado temporalmente.

```bash
node scripts/tribunal/update-reviews.js
```

Para modo watch (regenera automáticamente al detectar cambios):

```bash
node scripts/tribunal/update-reviews.js --watch
```

### Integración CI/CD

El Ledger puede actualizarse automáticamente. Ejemplo como git hook:

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

## Guía de Selección de Modelos

Cada rol tiene necesidades distintas. Esta tabla es orientativa — los modelos evolucionan rápido:

| Rol | Qué necesita | Criterio clave |
|:----|:-------------|:---------------|
| **Checker** | Análisis técnico detallado, detectar patrones de vulnerabilidad | Conocimiento profundo del dominio auditado |
| **Maker** | Leer reporte + código, implementar cambios precisos, argumentar rechazos | Precisión de edición de código + razonamiento para refutaciones |
| **Judge** | Evaluar calidad de ambos agentes, detectar inconsistencias, visión global | Razonamiento largo, análisis crítico, alto context window |

El Judge debería ser el modelo más capaz disponible. El Checker y el Maker pueden ser modelos de rango medio con buen conocimiento del dominio. No se recomienda usar modelos pequeños o rápidos para el Judge — su valor está en el análisis profundo.

**Nota sobre el Maker:** Este rol exige precisión de edición de código. Modelos que tienden a duplicar bloques durante ediciones largas no son recomendables como Maker, independientemente de su capacidad analítica. Pueden ser excelentes como Checker o Judge.

---

## Reglas Cardinales

1. **Separación de contexto.** El Maker no debe ser el mismo agente ni la misma sesión que el Checker. Esta es la regla más importante del protocolo.
2. **Refutación obligatoria.** Todo hallazgo rechazado por el Maker requiere justificación técnica escrita y verificable.
3. **El Judge no codifica.** Su rol es exclusivamente evaluativo y directivo.
4. **Gate de validación.** Ningún cambio se marca como implementado sin evidencia de validación documentada.
5. **Trazabilidad total.** Cada fase registra modelo, sesión y timestamp en el YAML.
6. **El README humano es sagrado.** El `README.md` raíz del proyecto es para humanos. Nunca se contamina con metadatos de QA. Todo vive dentro de `docs/reviews/`.

---

*TRIBUNAL Protocol v2.0 — Framework de QA Inter-Agente*
