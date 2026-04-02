#!/usr/bin/env node

/**
 * TRIBUNAL Protocol — The Ledger
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
function parseFrontmatter(content) {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) return null;

  const yaml = {};
  const lines = match[1].split("\n");
  let currentKey = null;
  let currentIndent = 0;
  let parentKey = null;

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

    // Detectar nesting (indent > 0 significa sub-objeto)
    if (indent === 0) {
      if (rawValue.trim() === "" || rawValue.trim() === "") {
        // Es un objeto padre
        parentKey = key;
        yaml[key] = yaml[key] || {};
      } else {
        yaml[key] = value;
        parentKey = null;
      }
    } else if (parentKey) {
      yaml[parentKey][key] = value;
    }
  }

  return yaml;
}

// ── Emojis y etiquetas de estado ────────────────────────────────
const STATUS_BADGE = {
  draft: "⬜ Draft",
  audited: "🔍 Audited",
  implemented: "🔧 Implemented",
  verified: "✅ Verified",
  rejected: "❌ Rejected",
  escalated: "⚠️ Escalated",
};

const VERDICT_BADGE = {
  approved: "✅ Approved",
  "conditionally-approved": "🟡 Conditionally Approved",
  rejected: "❌ Rejected",
  escalated: "⚠️ Escalated",
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
  md += `| Fecha | Tipo | Componente | Auditor | Ejecutor | Juez | Estado | Veredicto | Archivo |\n`;
  md += `|:------|:-----|:-----------|:--------|:---------|:-----|:-------|:----------|:--------|\n`;

  for (const r of reviews) {
    const date = (r.created_at || "—").slice(0, 10);
    const tipo = `${TYPE_EMOJI[r.tipo] || "📋"} ${r.tipo || "—"}`;
    const comp = r.componente ? `\`${r.componente}\`` : "—";
    const auditor = r.auditor?.model || "—";
    const executor = r.executor?.model || "—";
    const judge = r.judge?.model || "—";
    const status = STATUS_BADGE[r.status] || r.status || "—";
    const verdict = r.judge?.verdict
      ? VERDICT_BADGE[r.judge.verdict] || r.judge.verdict
      : "—";
    const link = `[${r.file}](./${r.file})`;

    md += `| ${date} | ${tipo} | ${comp} | ${auditor} | ${executor} | ${judge} | ${status} | ${verdict} | ${link} |\n`;
  }

  md += `\n---\n\n`;
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
