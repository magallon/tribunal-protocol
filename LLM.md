# Instrucciones para Modelos de IA

Estás trabajando en un repositorio que sigue el **TRIBUNAL Protocol** — un sistema de Control de Calidad Inter-Agente (Agent-to-Agent QA).

## Regla Principal

Si tu tarea involucra **auditoría de código**, **refactorización**, **revisión de seguridad**, **análisis de rendimiento**, **mejoras de accesibilidad**, o **cambios arquitectónicos críticos**, este repositorio requiere que sigas un proceso formal documentado.

## Qué Hacer

1. **Lee primero** la plantilla obligatoria: [`docs/reviews/TEMPLATE.md`](docs/reviews/TEMPLATE.md)
2. **Lee el protocolo completo** si necesitas contexto: [`docs/reviews/PROTOCOL.md`](docs/reviews/PROTOCOL.md)
3. **Crea tu reporte** como copia de la plantilla en `docs/reviews/[tipo]-audit-[YYYYMMDD].md`
4. **Rellena los campos YAML** del frontmatter con tu modelo, sesión y timestamp
5. **Sigue tu rol asignado** (Checker, Maker, o Judge) sin invadir las secciones de otros roles

## Qué NO Hacer

- No audites código que tú mismo generaste en la misma sesión
- No omitas el frontmatter YAML; es requerido para el índice automatizado
- No edites el `README.md` raíz del proyecto con metadatos de QA
- No rellenes secciones de un rol que no es el tuyo

## Referencia Rápida de Roles

| Rol | Qué hace | Qué produce |
|:----|:---------|:------------|
| **Checker** (Fase 1) | Audita código crudo, busca vulnerabilidades | Reporte de hallazgos con sugerencias |
| **Maker** (Fase 2) | Lee el reporte, implementa o rechaza hallazgos | Código + Tabla de Disposición |
| **Judge** (Fase 3) | Evalúa la calidad de ambos agentes | Veredicto + Líneas rectoras |
