#!/usr/bin/env node

/**
 * TRIBUNAL Protocol v2.0 — The Ledger
 * 
 * Lee los campos YAML frontmatter de todos los archivos de revisión
 * en docs/reviews/ y genera un README.md dinámico ordenado temporalmente.
 *
 * Uso:
 *   node scripts/tribunal/update-reviews.js
 *   node scripts/tribunal/update-reviews.js --watch
 *
 * Integración CI/CD:
 *   Agregar como post-commit hook o step en pipeline.
 *
 * Zero dependencies — solo usa módulos nativos de Node.js.
 */

const fs = require("fs");
const path = require("path");

// ── Configuración ───────────────────────────────────────────────
const REVIEWS_DIR = path.resolve(__dirname, "../../docs/reviews");
const OUTPUT_FILE = path.join(REVIEWS_DIR, "README.md");
const TEMPLATE_FILE = "TEMPLATE.md";
const PROTOCOL_FILE = "PROTOCOL.md";
const IGNORED_FILES = new Set([
  "README.md",
  TEMPLATE_FILE,
  PROTOCOL_FILE,
  ".gitkeep",
]);

// ── Parser YAML Frontmatter (sin dependencias externas) ─────────
// Soporta nesting de hasta 2 niveles (ej. executor.validation.result)
function parseFrontmatter(content) {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) return null;

  const yaml = {};
  const lines = match[1].split("\n");
  let parentKey = null;
  let grandparentKey = null;

  for (const line of lines) {
    // Saltar comentarios y líneas vacías
    if (line.trim().startsWith("#") || line.trim() === "") continue;

    const indent = line.search(/\S/);
    const trimmed = line.trim();

    // Detectar par clave:valor
    const kvMatch = trimmed.match(/^([a-z_]+)\s*:\s*(.*)$/);
    if (!kvMatch) continue;

    const [, key, rawValue] = kvMatch;
    let value = rawValue.trim();

    // Limpiar comillas
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    // Parsear valores especiales
    if (value === "null" || value === "") value = null;
    else if (value === "true") value = true;
    else if (value === "false") value = false;
    else if (value === "[]") value = [];
    else if (/^\d+$/.test(value)) value = parseInt(value, 10);

    // Detectar nesting por nivel de indentación
    if (indent === 0) {
      // Nivel raíz
      if (value === null && rawValue.trim() === "") {
        parentKey = key;
        grandparentKey = null;
        yaml[key] = yaml[key] || {};
      } else {
        yaml[key] = value;
        parentKey = null;
        grandparentKey = null;
      }
    } else if (indent >= 4 && grandparentKey && parentKey) {
      // Nivel 2 (ej. executor.validation.result)
      if (!yaml[grandparentKey][parentKey]) {
        yaml[grandparentKey][parentKey] = {};
      }
      yaml[grandparentKey][parentKey][key] = value;
    } else if (indent >= 2 && parentKey) {
      // Nivel 1 (ej. executor.model)
      if (value === null && rawValue.trim() === "") {
        // Sub-objeto (ej. validation:)
        grandparentKey = parentKey;
        parentKey = key;
        yaml[grandparentKey][key] = yaml[grandparentKey][key] || {};
      } else {
        yaml[parentKey][key] = value;
      }
    }
  }

  return yaml;
}

// ── Emojis y etiquetas de estado ────────────────────────────────
const STATUS_BADGE = {
  // v2.0 estados
  draft: "⬜ Draft",
  audited: "🔍 Audited",
  validated: "✅ Validated",
  blocked: "🚫 Blocked",
  reviewed: "🏛️ Reviewed",
  // v1.x compatibilidad
  implemented: "🔧 Implemented",
  verified: "✅ Verified",
  rejected: "❌ Rejected",
  escalated: "⚠️ Escalated",
};

const VERDICT_BADGE = {
  // v2.0 veredictos
  "reviewed-ok": "✅ OK",
  "reviewed-issues": "🟡 Issues",
  "reviewed-escalated": "⚠️ Escalated",
  // v1.x compatibilidad
  approved: "✅ Approved",
  "conditionally-approved": "🟡 Conditionally Approved",
  rejected: "❌ Rejected",
  escalated: "⚠️ Escalated",
};

const VALIDATION_BADGE = {
  pass: "✅ Pass",
  fail: "❌ Fail",
};

const TYPE_EMOJI = {
  security: "🔒",
  performance: "⚡",
  accessibility: "♿",
  architecture: "🏗️",
  refactor: "🔄",
};

// ── Leer y procesar archivos ────────────────────────────────────
function readReviews() {
  if (!fs.existsSync(REVIEWS_DIR)) {
    console.error(`Error: El directorio ${REVIEWS_DIR} no existe.`);
    process.exit(1);
  }

  const files = fs
    .readdirSync(REVIEWS_DIR)
    .filter((f) => f.endsWith(".md") && !IGNORED_FILES.has(f));

  const reviews = [];

  for (const file of files) {
    const filePath = path.join(REVIEWS_DIR, file);
    const content = fs.readFileSync(filePath, "utf-8");
    const meta = parseFrontmatter(content);

    if (!meta) {
      console.warn(`⚠️  Sin frontmatter YAML: ${file}`);
      continue;
    }

    reviews.push({
      file,
      ...meta,
      _sortDate: meta.created_at || meta.updated_at || "0000-00-00",
    });
  }

  // Ordenar por fecha descendente (más reciente primero)
  reviews.sort((a, b) => (b._sortDate > a._sortDate ? 1 : -1));

  return reviews;
}

// ── Generar el README ───────────────────────────────────────────
function generateReadme(reviews) {
  const now = new Date().toISOString().replace("T", " ").slice(0, 19);

  let md = `# 🏛️ TRIBUNAL — Registro de Revisiones (The Ledger)

> Índice auto-generado por \`scripts/tribunal/update-reviews.js\`  
> Última actualización: ${now} UTC  
> Total de revisiones: **${reviews.length}**

---

`;

  if (reviews.length === 0) {
    md += `*No hay revisiones registradas. Copia \`TEMPLATE.md\` para iniciar una auditoría.*\n`;
    return md;
  }

  // ── Resumen por estado ──
  const statusCounts = {};
  for (const r of reviews) {
    const s = r.status || "unknown";
    statusCounts[s] = (statusCounts[s] || 0) + 1;
  }

  md += `## Resumen\n\n`;
  md += `| Estado | Cantidad |\n|:-------|:---------|\n`;
  for (const [status, count] of Object.entries(statusCounts)) {
    md += `| ${STATUS_BADGE[status] || status} | ${count} |\n`;
  }
  md += `\n---\n\n`;

  // ── Tabla principal ──
  md += `## Registro Cronológico\n\n`;
  md += `| Fecha | Tipo | Componente | Checker | Maker | Validación | Estado | Judge | Archivo |\n`;
  md += `|:------|:-----|:-----------|:--------|:------|:-----------|:-------|:------|:--------|\n`;

  for (const r of reviews) {
    const date = (r.created_at || "—").slice(0, 10);
    const tipo = `${TYPE_EMOJI[r.tipo] || "📋"} ${r.tipo || "—"}`;
    const comp = r.componente ? `\`${r.componente}\`` : "—";
    const checker = r.auditor?.model || "—";
    const maker = r.executor?.model || "—";
    const validation = r.executor?.validation?.result
      ? VALIDATION_BADGE[r.executor.validation.result] || r.executor.validation.result
      : "—";
    const status = STATUS_BADGE[r.status] || r.status || "—";
    const judge = r.judge?.verdict
      ? VERDICT_BADGE[r.judge.verdict] || r.judge.verdict
      : "—";
    const link = `[${r.file}](./${r.file})`;

    md += `| ${date} | ${tipo} | ${comp} | ${checker} | ${maker} | ${validation} | ${status} | ${judge} | ${link} |\n`;
  }

  md += `\n---\n\n`;

  // ── Auditorías bloqueadas (si las hay) ──
  const blocked = reviews.filter((r) => r.status === "blocked");
  if (blocked.length > 0) {
    md += `## ⚠️ Auditorías Bloqueadas\n\n`;
    md += `| Fecha | Componente | Maker | Notas | Archivo |\n`;
    md += `|:------|:-----------|:------|:------|:--------|\n`;

    for (const r of blocked) {
      const date = (r.created_at || "—").slice(0, 10);
      const comp = r.componente ? `\`${r.componente}\`` : "—";
      const maker = r.executor?.model || "—";
      const notes = r.executor?.validation?.notes || "—";
      const link = `[${r.file}](./${r.file})`;

      md += `| ${date} | ${comp} | ${maker} | ${notes} | ${link} |\n`;
    }

    md += `\n---\n\n`;
  }

  // ── Revisiones del Judge (si las hay) ──
  const reviewed = reviews.filter((r) => r.status === "reviewed");
  if (reviewed.length > 0) {
    const batches = {};
    for (const r of reviewed) {
      const batch = r.judge?.review_batch || "sin-lote";
      if (!batches[batch]) batches[batch] = [];
      batches[batch].push(r);
    }

    md += `## 🏛️ Evaluaciones del Judge\n\n`;

    for (const [batch, items] of Object.entries(batches)) {
      md += `### Lote: \`${batch}\`\n\n`;
      md += `| Componente | Checker Score | Maker Score | Veredicto | Archivo |\n`;
      md += `|:-----------|:-------------|:------------|:----------|:--------|\n`;

      for (const r of items) {
        const comp = r.componente ? `\`${r.componente}\`` : "—";
        const cScore = r.judge?.auditor_score != null ? `${r.judge.auditor_score}/100` : "—";
        const mScore = r.judge?.executor_score != null ? `${r.judge.executor_score}/100` : "—";
        const verdict = r.judge?.verdict
          ? VERDICT_BADGE[r.judge.verdict] || r.judge.verdict
          : "—";
        const link = `[${r.file}](./${r.file})`;

        md += `| ${comp} | ${cScore} | ${mScore} | ${verdict} | ${link} |\n`;
      }

      md += `\n`;
    }

    md += `---\n\n`;
  }

  md += `*Generado automáticamente por [TRIBUNAL Protocol](./PROTOCOL.md). No editar manualmente.*\n`;

  return md;
}

// ── Main ────────────────────────────────────────────────────────
function main() {
  const args = process.argv.slice(2);

  console.log("🏛️  TRIBUNAL — Generando The Ledger...\n");

  const reviews = readReviews();
  const readme = generateReadme(reviews);

  fs.writeFileSync(OUTPUT_FILE, readme, "utf-8");
  console.log(`✅ ${OUTPUT_FILE} generado con ${reviews.length} revisión(es).`);

  // Modo watch opcional
  if (args.includes("--watch")) {
    console.log("\n👁️  Modo watch activo. Ctrl+C para salir.\n");
    fs.watch(REVIEWS_DIR, (eventType, filename) => {
      if (filename && filename.endsWith(".md") && filename !== "README.md") {
        console.log(`📝 Cambio detectado: ${filename}`);
        const updatedReviews = readReviews();
        const updatedReadme = generateReadme(updatedReviews);
        fs.writeFileSync(OUTPUT_FILE, updatedReadme, "utf-8");
        console.log(`✅ Ledger actualizado.`);
      }
    });
  }
}

main();
