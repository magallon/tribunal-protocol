---
# TRIBUNAL Protocol — Agent-to-Agent QA Framework v2.0
# Archivo de Revisión Inter-Agente

# ── Metadatos Generales ──
schema_version: "2.0"
id: ""                          # Formato: [tipo]-[componente]-[YYYYMMDD]-[HHmm]
tipo: ""                        # security | performance | accessibility | architecture | refactor
componente: ""                  # Ruta o nombre del módulo auditado (ej. src/components/PaymentForm.tsx)
alcance: ""                     # Mira concreta de la auditoría (ej. "XSS y CSRF en formulario de pago")
max_severity: ""                # Severidad más alta entre todos los hallazgos: critical | high | medium | low
status: "draft"                 # draft → audited → validated | blocked → reviewed
tags: []                        # Etiquetas libres (ej. [xss, csrf, react, a11y])
created_at: ""                  # ISO 8601: 2025-07-15T09:30:00-06:00
updated_at: ""                  # Se actualiza en cada fase

# ── Checker (Auditor) ──────────────────────────────────────────
auditor:
  model: ""                     # Identificador del modelo (ej. qwen-3.6, claude-sonnet-4, gpt-4o)
  session_id: ""                # Hash o ID de sesión/conversación (trazabilidad)
  timestamp: ""                 # Cuándo se ejecutó la auditoría
  findings_count: 0             # Total de hallazgos reportados
  confidence: ""                # high | medium | low — Autodiagnóstico del auditor

# ── Maker (Ejecutor) ───────────────────────────────────────────
executor:
  model: ""                     # Modelo que implementó los cambios
  session_id: ""
  timestamp: ""
  commit_ref: ""                # Hash del commit o tag (ej. fix/xss-payment-20250715)
  accepted_count: 0             # Hallazgos aceptados e implementados
  rejected_count: 0             # Hallazgos rechazados con justificación
  partial_count: 0              # Hallazgos parcialmente implementados
  emergent_count: 0             # Hallazgos nuevos descubiertos durante implementación
  waves_count: 0                # Número de oleadas ejecutadas
  validation:
    tools_used: []              # Mecanismos de validación ejecutados (ej. ["build", "tests", "linter"])
    result: ""                  # pass | fail
    notes: ""                   # Anomalías detectadas o detalles relevantes

# ── Judge (Juez) — Se llena durante revisión periódica ─────────
judge:
  model: ""                     # Modelo frontera usado (ej. claude-opus-4)
  session_id: ""
  timestamp: ""
  review_batch: ""              # ID del lote de revisión (ej. batch-2025Q3-001)
  auditor_score: null           # 0-100: Calidad del reporte de auditoría
  executor_score: null          # 0-100: Calidad de la implementación
  verdict: ""                   # reviewed-ok | reviewed-issues | reviewed-escalated
  drift_detected: false         # ¿Se detectó desviación arquitectónica?
  new_audit_recommended: false  # ¿El Juez recomienda abrir un nuevo ciclo?
  notes: ""                     # Observaciones del Juez sobre esta auditoría
---

<!-- ================================================================
     TRIBUNAL Protocol v2.0 — Plantilla de Revisión Inter-Agente
     
     FLUJO OPERATIVO:
     1. Copia este archivo como: [tipo]-audit-[YYYYMMDD].md
     2. Checker (Auditor): Rellena la sección de Hallazgos
     3. Maker (Ejecutor): Implementa, valida, rellena Tabla de Disposición
     
     GOBERNANZA PERIÓDICA:
     4. Judge (Juez): Revisa esta auditoría como parte de un lote
     
     REGLA FUNDAMENTAL: Cada fase es ejecutada por un agente/sesión
     DISTINTO. Ningún agente evalúa su propio trabajo.
     ================================================================ -->

# 🏛️ Revisión: `{id}`

> **Componente:** `{componente}`  
> **Alcance:** `{alcance}`  
> **Tipo:** `{tipo}` | **Severidad máxima:** `{max_severity}`  
> **Estado:** `{status}`

---

## Checker — Reporte de Auditoría

**Modelo:** `{auditor.model}` | **Fecha:** `{auditor.timestamp}`

<!-- ─── INSTRUCCIONES PARA EL CHECKER ───
     Tu mandato: analizar código crudo sin contexto previo.
     
     DEBES:
     • Citar archivo y línea exacta para cada hallazgo
     • Diferenciar severidad con rigor:
       - critical: explotable ahora, vector demostrable
       - high: potencial real, requiere condiciones
       - medium: mejora técnica con impacto medible
       - low: cosmético o convención
     • Verificar que el hallazgo no esté ya corregido
     • Buscar problemas de integridad estructural (duplicaciones, imports rotos)
     
     NO DEBES:
     • Proponer implementaciones completas de código
     • Asumir contexto de decisiones previas
     
     Al terminar: actualiza status a "audited" y findings_count en el YAML.
     ─────────────────────────────────── -->

### Resumen Ejecutivo

<!-- Párrafo conciso del estado general del componente auditado -->

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
<!-- Dirección técnica — no implementación completa. El Maker decidirá el "cómo". -->

---

#### [F-002] ...

<!-- Repetir bloque por cada hallazgo -->

---

## Maker — Tabla de Disposición

**Modelo:** `{executor.model}` | **Fecha:** `{executor.timestamp}`  
**Commit/Tag:** `{executor.commit_ref}`

<!-- ─── INSTRUCCIONES PARA EL MAKER ───
     Tu mandato: implementar, rechazar con argumento, o marcar como parcial.
     
     DEBES:
     • Verificar integridad estructural después de cada edición
     • Implementar por oleadas si hay múltiples hallazgos:
       agrupar → implementar grupo → validar → siguiente grupo
     • Ejecutar el gate de validación antes de declarar implementado
     • Documentar hallazgos emergentes (E-001...) si descubres problemas nuevos
     • Un commit por hallazgo o grupo coherente
     
     NO DEBES:
     • Rechazar sin refutación técnica argumentada
     • Marcar como implementado sin pasar validación
     • Corregir problemas silenciosamente — todo va en la bitácora
     
     Al terminar: actualiza status a "validated" o "blocked",
     rellena el bloque executor y validation en el YAML.
     ─────────────────────────────────── -->

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

<!-- Problemas que el Maker descubrió DURANTE la implementación
     y que NO estaban en el reporte del Checker. Prefijo E- obligatorio. -->

| # Hallazgo | Severidad | Descripción | Acción Tomada |
|:-----------|:----------|:------------|:--------------|
| E-001      | `medium`  | Al implementar F-001, se detectó que... | Corregido en el mismo commit. |
| E-002      | `low`     | ... | Reportado. Fuera del alcance de esta auditoría. |

### Registro de Validación

<!-- Documenta aquí las validaciones ejecutadas como evidencia del gate. -->

| Validación | Comando / Método | Resultado | Notas |
|:-----------|:-----------------|:----------|:------|
| Build      | (ej. `npm run build`) | ✅ Pass \| ❌ Fail | |
| Tests      | (ej. `npm test`)      | ✅ Pass \| ❌ Fail | |
| Linter     | (ej. `eslint src/`)   | ✅ Pass \| ❌ Fail | |
| Integridad | (verificación de duplicaciones) | ✅ Pass \| ❌ Fail | |

### Notas del Maker

<!-- Contexto adicional, deuda técnica identificada, o dependencias bloqueantes -->

---

## Judge — Evaluación Periódica

<!-- ════════════════════════════════════════════════════════
     Esta sección NO se llena en cada auditoría.
     
     El Judge revisa esta auditoría como parte de un lote
     periódico (cada 5-10 auditorías, o ante alto riesgo).
     Su valor es evaluar el PROCESO, no solo este caso.
     ════════════════════════════════════════════════════════ -->

**Modelo:** `{judge.model}` | **Fecha:** `{judge.timestamp}`  
**Lote de revisión:** `{judge.review_batch}`

### Calificaciones

| Agente   | Puntuación | Evaluación |
|:---------|:-----------|:-----------|
| Checker  | `{judge.auditor_score}`/100 | <!-- ¿Exhaustivo? ¿Falsos positivos? ¿Severidad calibrada? --> |
| Maker    | `{judge.executor_score}`/100 | <!-- ¿Implementaciones correctas? ¿Rechazos justificados? ¿Gate cumplido? --> |

### Veredicto

<!-- 
Opciones:
  REVIEWED-OK         — Sin observaciones relevantes
  REVIEWED-ISSUES     — Hay problemas documentados pero no requieren acción inmediata
  REVIEWED-ESCALATED  — Requiere intervención humana o nuevo ciclo Checker → Maker
-->

**`{judge.verdict}`**

### Diagnóstico

<!-- El Juez analiza esta auditoría en contexto del lote. Debe responder:
  1. ¿El Checker generó falsos positivos que presionaron al Maker?
  2. ¿El Maker rompió funcionalidad o consistencia al implementar?
  3. ¿Se detectó desviación arquitectónica?
  4. ¿Los rechazos estaban técnicamente fundamentados?
  5. ¿Los hallazgos emergentes (E-*) revelan puntos ciegos del Checker?
  6. ¿El gate de validación fue ejecutado con rigor?
  7. ¿Se detectan patrones recurrentes comparando con otras auditorías del lote?
-->

### Líneas Rectoras

<!-- Directivas correctivas para futuras iteraciones del proyecto.
     Si los problemas son graves, marcar new_audit_recommended: true en el YAML. -->

1. ...
2. ...

---

<!-- Fin del documento. No editar debajo de esta línea. -->
<!-- TRIBUNAL Protocol v2.0 — https://github.com/your-org/tribunal-protocol -->
