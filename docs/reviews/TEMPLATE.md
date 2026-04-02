---
# TRIBUNAL Protocol — Agent-to-Agent QA Framework v1.1
# Archivo de Revisión Inter-Agente

# ── Metadatos Generales ──
schema_version: "1.1"
id: ""                          # Auto-generado: [tipo]-[componente]-[YYYYMMDD]-[HHmm]
tipo: ""                        # performance | security | accessibility | architecture | refactor
componente: ""                  # Ruta o nombre del módulo auditado (ej. src/components/PaymentForm.tsx)
max_severity: ""                # Severidad más alta entre todos los hallazgos: critical | high | medium | low
status: "draft"                 # draft → audited → implemented → verified | rejected
tags: []                        # Etiquetas libres (ej. [xss, csrf, react, a11y])
created_at: ""                  # ISO 8601: 2025-07-15T09:30:00-06:00
updated_at: ""                  # Se actualiza en cada fase

# ── Fase 1: El Auditor (Checker) ────────────────────────────────
auditor:
  model: ""                     # Identificador del modelo (ej. qwen-3.6, claude-sonnet-4, gpt-4o)
  session_id: ""                # Hash o ID de sesión/conversación (trazabilidad)
  timestamp: ""                 # Cuándo se ejecutó la auditoría
  scope: ""                     # Qué se le pidió revisar (ej. "XSS en inputs de usuario")
  findings_count: 0             # Total de hallazgos reportados
  critical_count: 0             # Hallazgos críticos
  confidence: ""                # high | medium | low — Autodiagnóstico del auditor

# ── Fase 2: El Ejecutor (Maker) ─────────────────────────────────
executor:
  model: ""                     # Modelo que implementó los cambios
  session_id: ""
  timestamp: ""
  commit_ref: ""                # Hash del commit o tag (ej. fix/xss-payment-20250715)
  accepted_count: 0             # Hallazgos aceptados e implementados
  rejected_count: 0             # Hallazgos rechazados con justificación
  partial_count: 0              # Hallazgos parcialmente implementados
  emergent_count: 0             # Hallazgos nuevos descubiertos durante implementación

# ── Fase 3: El Juez (Judge) ─────────────────────────────────────
judge:
  model: ""                     # Modelo frontera usado (ej. claude-opus-4)
  session_id: ""
  timestamp: ""
  verdict: ""                   # approved | conditionally-approved | rejected | escalated
  auditor_score: null           # 0-100: Calidad del reporte de auditoría
  executor_score: null          # 0-100: Calidad de la implementación
  drift_detected: false         # ¿Se detectó desviación arquitectónica?
  next_action: ""               # Instrucción rectora para el proyecto
---

<!-- ================================================================
     TRIBUNAL Protocol — Plantilla de Revisión Inter-Agente
     
     INSTRUCCIONES DE USO:
     1. Copia este archivo como: [tipo]-audit-[YYYYMMDD].md
     2. Fase 1 (Auditor): Rellena la sección de Hallazgos
     3. Fase 2 (Ejecutor): Rellena la Tabla de Disposición
     4. Fase 3 (Juez): Rellena el Veredicto Final
     
     REGLA DE ORO: Cada fase es ejecutada por un agente/sesión DISTINTO.
     Ningún agente debe auditar su propio código.
     ================================================================ -->

# 🏛️ Revisión: `{id}`

> **Componente:** `{componente}`  
> **Tipo:** `{tipo}` | **Severidad máxima:** `{max_severity}`  
> **Estado:** `{status}`

---

## Fase 1 — Reporte de Auditoría (Checker)

**Modelo:** `{auditor.model}` | **Fecha:** `{auditor.timestamp}`  
**Alcance:** {auditor.scope}

### Resumen Ejecutivo

<!-- El Auditor escribe aquí un párrafo conciso del estado general del componente -->

### Hallazgos

<!-- Usar la siguiente estructura por cada hallazgo. Numerar secuencialmente. -->

#### [F-001] Título descriptivo del hallazgo

| Campo        | Valor                                    |
|:-------------|:-----------------------------------------|
| Severidad    | `critical` \| `high` \| `medium` \| `low` |
| Categoría    | (ej. XSS, CSRF, a11y-contrast, perf-bundle) |
| Ubicación    | `archivo:línea` o rango                  |
| Confianza    | `alta` \| `media` \| `baja`             |

**Descripción:**  
<!-- Explicación técnica del problema encontrado -->

**Evidencia / Reproducción:**  
```
<!-- Fragmento de código, comando, o pasos para reproducir -->
```

**Sugerencia de Remediación:**  
<!-- Propuesta técnica del Auditor. El Ejecutor decidirá si la adopta. -->

---

#### [F-002] ...

<!-- Repetir bloque por cada hallazgo -->

---

## Fase 2 — Tabla de Disposición (Maker)

**Modelo:** `{executor.model}` | **Fecha:** `{executor.timestamp}`  
**Commit/Tag:** `{executor.commit_ref}`

### Cambios Ejecutados

| # Hallazgo | Acción Tomada          | Archivo(s) Modificado(s) | Notas |
|:-----------|:-----------------------|:-------------------------|:------|
| F-001      | Implementado tal cual  | `src/...`                |       |
| F-003      | Implementado con variación | `src/...`            | Se usó enfoque alternativo porque... |

### Cambios Rechazados

| # Hallazgo | Motivo de Rechazo (Refutación Técnica)                   |
|:-----------|:---------------------------------------------------------|
| F-002      | Falso positivo: el sanitizador ya existe en el middleware upstream (`lib/sanitize.ts:42`). Prueba: [enlace a test]. |
| F-004      | Trade-off inaceptable: la sugerencia degrada TTI en +800ms según benchmark adjunto. |

### Cambios Parciales

| # Hallazgo | Qué se implementó | Qué quedó pendiente y por qué |
|:-----------|:-------------------|:------------------------------|
| F-005      | Se agregó CSP header | Nonce dinámico queda para siguiente sprint por dependencia de infraestructura |

### Hallazgos Emergentes

<!-- Problemas, riesgos o mejoras que el Ejecutor descubrió DURANTE la implementación
     y que NO estaban en el reporte original del Auditor. Usar prefijo E- para distinguirlos. -->

| # Hallazgo | Severidad | Descripción | Acción Tomada |
|:-----------|:----------|:------------|:--------------|
| E-001      | `medium`  | Al implementar F-001, se detectó que el componente padre no propaga errores de validación al formulario hijo. | Corregido en el mismo commit. |
| E-002      | `low`     | Variable de entorno `API_KEY` hardcodeada en archivo de test visible en repo público. | Reportado. Queda fuera del alcance de esta auditoría. |

### Notas del Ejecutor

<!-- Contexto adicional, deuda técnica identificada, o dependencias bloqueantes -->

---

## Fase 3 — Veredicto (Judge)

**Modelo:** `{judge.model}` | **Fecha:** `{judge.timestamp}`

### Calificaciones

| Agente   | Puntuación | Evaluación |
|:---------|:-----------|:-----------|
| Auditor  | `{judge.auditor_score}`/100 | <!-- ¿Fue exhaustivo? ¿Hubo falsos positivos? ¿La severidad fue correcta? --> |
| Ejecutor | `{judge.executor_score}`/100 | <!-- ¿Las implementaciones fueron correctas? ¿Los rechazos fueron justificados? --> |

### Veredicto

<!-- 
Opciones: APPROVED | CONDITIONALLY-APPROVED | REJECTED | ESCALATED
-->

**`{judge.verdict}`**

### Diagnóstico

<!-- El Juez escribe aquí su análisis. Debe responder:
  1. ¿El Auditor generó falsos positivos que presionaron al Ejecutor innecesariamente?
  2. ¿El Ejecutor rompió layout, funcionalidad o consistencia al implementar?
  3. ¿Se detectó desviación arquitectónica respecto a los patrones del proyecto?
  4. ¿Los rechazos del Ejecutor estaban técnicamente fundamentados?
  5. ¿Los hallazgos emergentes (E-*) revelan puntos ciegos del Auditor o son colaterales legítimos?
  6. ¿Algún hallazgo emergente requiere una nueva auditoría dedicada?
-->

### Líneas Rectoras

<!-- Directivas correctivas a nivel proyecto que deben seguirse en futuras iteraciones -->

1. ...
2. ...

---

<!-- Fin del documento. No editar debajo de esta línea. -->
<!-- TRIBUNAL Protocol v1.1 — https://github.com/your-org/tribunal-protocol -->
