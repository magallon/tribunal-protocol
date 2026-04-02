# 🏛️ TRIBUNAL Protocol

### Agent-to-Agent Quality Assurance Framework v1.1

> *"Ningún agente debe ser juez y parte de su propio código."*

---

## ¿Qué es TRIBUNAL?

**TRIBUNAL** (Tripartite Review by Independent Brainstorming Under Networked AI Layers) es un framework agnóstico de control de calidad inter-agentes para repositorios de código. Rompe la cámara de eco donde una sola IA programa y audita simultáneamente, reemplazándola con un ciclo de tres roles independientes que simulan un proceso corporativo de revisión estricta.

## El Problema

Cuando una IA genera código y se le pide revisarlo en la misma sesión, tiende a:

- **Confirmar sus propias decisiones** (sesgo de confirmación)
- **Alucinar correcciones** que no abordan problemas reales
- **Subestimar defectos** que ella misma introdujo
- **Crear cámaras de eco** donde el "auditor" y el "programador" comparten el mismo contexto contaminado

## La Solución: 3 Roles, 3 Fases

```
┌─────────────┐     Reporte      ┌─────────────┐    Implementación    ┌─────────────┐
│   CHECKER   │ ──────────────▸  │    MAKER    │ ───────────────────▸ │    JUDGE    │
│  (Auditor)  │   Hallazgos +    │  (Ejecutor) │   Código + Tabla     │    (Juez)   │
│             │   Sugerencias    │             │   de Disposición     │             │
│  Fase 1     │                  │  Fase 2     │                      │  Fase 3     │
└─────────────┘                  └─────────────┘                      └─────────────┘
   IA/Sesión A                      IA/Sesión B                         Modelo Frontera
```

### Fase 1 — El Auditor (Checker)

Una IA realiza un escaneo del componente objetivo bajo una mira concreta (rendimiento, seguridad XSS, accesibilidad, etc.). **No ve soluciones previas**; solo analiza código crudo.

- **Produce:** Reporte exhaustivo con hallazgos numerados y sugerencias de remediación
- **Archivo:** `docs/reviews/[tipo]-audit-[YYYYMMDD].md` (copia de `TEMPLATE.md`)
- **Estado YAML:** `status: audited`

### Fase 2 — El Ejecutor (Maker)

Otra IA o sesión distinta lee el reporte de Fase 1 junto con el código fuente. Decide cuáles hallazgos implementar en el código.

- **Produce:** Cambios en el código fuente + Tabla de Disposición (aceptados/rechazados/parciales/emergentes)
- **Obligatorio:** Refutaciones técnicas argumentadas para cada hallazgo rechazado
- **Hallazgos Emergentes:** Problemas descubiertos durante la implementación que no estaban en el reporte original (prefijo `E-`)
- **Estado YAML:** `status: implemented`
- **Commit tag:** Referenciado en el campo `executor.commit_ref`

### Fase 3 — El Juez (Judge)

Un modelo frontera con alto presupuesto de razonamiento. No codifica; lee las bitácoras y emite un veredicto.

- **Produce:** Calificaciones numéricas para Auditor y Ejecutor, diagnóstico de desviación arquitectónica, evaluación de hallazgos emergentes, líneas rectoras correctivas
- **Veredicto:** `approved` | `conditionally-approved` | `rejected` | `escalated`
- **Estado YAML:** `status: verified` o `status: rejected`

## Estructura de Archivos

```
proyecto/
├── LLM.md                          # Puntero raíz para IAs
├── .cursorrules                     # Puntero para Cursor IDE
├── AGENTS.md                        # Puntero para Cline/Windsurf/OpenCode
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

## El Ledger (Índice Automatizado)

El script `scripts/tribunal/update-reviews.js` lee los campos YAML de cada archivo en `docs/reviews/` y genera un `README.md` dinámico ordenado temporalmente.

```bash
node scripts/tribunal/update-reviews.js
```

Puede integrarse como hook post-commit o en CI/CD.

## Convenciones de Nombrado

| Tipo de Auditoría | Prefijo del archivo | Ejemplo |
|:------------------|:-------------------|:--------|
| Seguridad         | `security-audit-`  | `security-audit-20250715.md` |
| Rendimiento       | `perf-audit-`      | `perf-audit-20250720.md` |
| Accesibilidad     | `a11y-audit-`      | `a11y-audit-20250801.md` |
| Arquitectura      | `arch-audit-`      | `arch-audit-20250810.md` |
| Refactorización   | `refactor-audit-`  | `refactor-audit-20250815.md` |

## Flujo YAML de Estados

```
draft → audited → implemented → verified
                              → rejected
                              → escalated
```

## Reglas Cardinales

1. **Separación de contexto:** El Ejecutor NO debe ser el mismo agente/sesión que el Auditor.
2. **Refutación obligatoria:** Todo hallazgo rechazado requiere justificación técnica escrita.
3. **El Juez no codifica:** Su rol es exclusivamente evaluativo y directivo.
4. **Trazabilidad total:** Cada fase registra modelo, sesión y timestamp en el YAML.
5. **El README humano es sagrado:** Nunca contaminar el `README.md` raíz del proyecto con metadatos de QA.

---

*TRIBUNAL Protocol v1.1 — Framework de QA Inter-Agente*
