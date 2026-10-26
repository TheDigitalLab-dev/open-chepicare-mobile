#!/usr/bin/env node
import { readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const dir = dirname(fileURLToPath(import.meta.url));
const exportPath = join(dir, "mobile-routes-export.json");

const data = JSON.parse(readFileSync(exportPath, "utf8"));

const SCOPE_ORDER = ["public", "owner", "admin"];
const SCOPE_LABELS = {
  public: "Public (Sin autenticacion)",
  owner: "Owner (Dueno de mascota)",
  admin: "Admin (Panel administrativo)",
};

const METHOD_ORDER = ["GET", "POST", "PATCH", "PUT", "DELETE"];

function methodClass(method) {
  return method.toLowerCase();
}

function sortRoutes(routes) {
  return [...routes].sort((a, b) => {
    const ma = METHOD_ORDER.indexOf(a.method);
    const mb = METHOD_ORDER.indexOf(b.method);
    if (ma !== mb) return ma - mb;
    return a.path.localeCompare(b.path);
  });
}

const byScope = Object.fromEntries(SCOPE_ORDER.map((s) => [s, []]));

for (const ctrl of data.controllers) {
  if (!ctrl.included_routes?.length) continue;
  const scope = ctrl.scope;
  if (!byScope[scope]) continue;
  byScope[scope].push({
    controller: ctrl.controller,
    routes: sortRoutes(ctrl.included_routes),
  });
}

const totalIncluded = SCOPE_ORDER.reduce(
  (sum, scope) =>
    sum + byScope[scope].reduce((s, g) => s + g.routes.length, 0),
  0
);

// --- Markdown ---
const md = [];
md.push("# ChepiCare Mobile — Rutas API");
md.push("");
md.push(
  `> App: \`${data.app}\` · Exportado: ${data.exported_at} · **${totalIncluded} rutas** seleccionadas para la app movil`
);
md.push("");
md.push("## Resumen");
md.push("");
md.push("| Metrica | Valor |");
md.push("|---------|-------|");
md.push(`| Controladores totales | ${data.summary.total_controllers} |`);
md.push(`| Rutas totales (Rails) | ${data.summary.total_routes} |`);
md.push(`| Rutas incluidas (mobile) | ${data.summary.routes_included} |`);
md.push(`| Rutas excluidas | ${data.summary.routes_excluded} |`);
md.push("");
md.push("## Dominios");
md.push("");
for (const scope of SCOPE_ORDER) {
  const groups = byScope[scope];
  const count = groups.reduce((s, g) => s + g.routes.length, 0);
  md.push(`- **${SCOPE_LABELS[scope]}** — ${count} rutas, ${groups.length} controladores`);
}
md.push("");

for (const scope of SCOPE_ORDER) {
  const groups = byScope[scope];
  const count = groups.reduce((s, g) => s + g.routes.length, 0);
  md.push(`## ${SCOPE_LABELS[scope]}`);
  md.push("");
  md.push(`_${count} rutas en ${groups.length} controladores._`);
  md.push("");

  for (const group of groups) {
    md.push(`### \`${group.controller}\``);
    md.push("");
    md.push("| Metodo | Ruta | Action |");
    md.push("|--------|------|--------|");
    for (const route of group.routes) {
      md.push(`| ${route.method} | \`${route.path}\` | \`${route.action}\` |`);
    }
    md.push("");
  }
}

writeFileSync(join(dir, "mobile-routes.md"), md.join("\n"), "utf8");

// --- HTML ---
function esc(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const sections = SCOPE_ORDER.map((scope) => {
  const groups = byScope[scope];
  const count = groups.reduce((s, g) => s + g.routes.length, 0);
  const controllers = groups
    .map((group) => {
      const rows = group.routes
        .map(
          (route) =>
            `<div class="rt"><span class="vm ${methodClass(route.method)}">${esc(route.method)}</span><span class="rp">${esc(route.path)}</span><span class="rc">${esc(route.action)}</span></div>`
        )
        .join("\n");
      return `<div class="cg"><div class="cg-head"><span class="cg-name">${esc(group.controller)}</span><span class="cg-badge">${group.routes.length}</span></div>${rows}</div>`;
    })
    .join("\n");

  return `<section class="scope-section" data-scope="${scope}"><div class="scope-header ${scope}"><span>${esc(SCOPE_LABELS[scope])}</span><span class="sh-badge">${count} rutas</span></div>${controllers}</section>`;
}).join("\n");

const scopeCounts = SCOPE_ORDER.map(
  (scope) =>
    `<span class="st"><span class="dot dot-${scope}"></span>${esc(SCOPE_LABELS[scope].split(" (")[0])}: ${byScope[scope].reduce((s, g) => s + g.routes.length, 0)}</span>`
).join("\n");

const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ChepiCare Mobile — Rutas API</title>
<style>
:root{--bg:hsl(43,44%,97%);--fg:hsl(210,24%,16%);--card:#fff;--primary:hsl(174,55%,47%);--primary-fg:#fff;--secondary:hsl(174,20%,95%);--secondary-fg:hsl(174,55%,25%);--muted:hsl(42,25%,92%);--muted-fg:hsl(215,16%,47%);--border:hsl(174,20%,88%);--success:hsl(142,76%,36%);--danger:hsl(0,84%,60%);--warning:hsl(38,92%,50%);--info:hsl(199,89%,48%);--r:.5rem}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:system-ui,-apple-system,sans-serif;background:var(--bg);color:var(--fg);line-height:1.5;padding:1.5rem;max-width:1060px;margin:0 auto}
h1{font-size:1.5rem;font-weight:700;margin-bottom:.25rem}
.sub{color:var(--muted-fg);font-size:.875rem;margin-bottom:1rem}
.bar{display:flex;gap:.75rem;flex-wrap:wrap;align-items:center;margin-bottom:1rem;padding-bottom:.75rem;border-bottom:1px solid var(--border)}
.st{display:flex;align-items:center;gap:.3rem;font-size:.8rem;font-weight:600}
.dot{width:9px;height:9px;border-radius:50%;display:inline-block}
.dot-public{background:var(--info)}.dot-owner{background:var(--success)}.dot-admin{background:var(--danger)}
.filters{display:flex;gap:.5rem;flex-wrap:wrap;margin-bottom:1rem}
.fil{padding:.3rem .7rem;font-size:.75rem;font-weight:600;border:1px solid var(--border);border-radius:var(--r);cursor:pointer;background:var(--card);color:var(--fg);transition:all .15s}
.fil:hover,.fil.active{background:var(--primary);color:var(--primary-fg);border-color:var(--primary)}
.scope-section{margin-bottom:2rem}
.scope-header{font-size:1.1rem;font-weight:700;padding:.6rem .75rem;margin-bottom:.75rem;border-left:4px solid var(--primary);background:var(--secondary);border-radius:0 var(--r) var(--r) 0;display:flex;align-items:center;justify-content:space-between}
.scope-header .sh-badge{font-size:.75rem;background:var(--primary);color:var(--primary-fg);padding:.15rem .6rem;border-radius:9999px;font-weight:700}
.scope-header.admin{border-left-color:var(--danger)}.scope-header.admin .sh-badge{background:var(--danger)}
.scope-header.public{border-left-color:var(--info)}.scope-header.public .sh-badge{background:var(--info)}
.scope-header.owner{border-left-color:var(--success)}.scope-header.owner .sh-badge{background:var(--success)}
.cg{margin-bottom:1.25rem}
.cg-head{display:flex;align-items:center;justify-content:space-between;padding:.5rem .75rem;background:var(--secondary);border:1px solid var(--border);border-radius:var(--r) var(--r) 0 0}
.cg-name{font-size:.875rem;font-weight:700;color:var(--secondary-fg);font-family:ui-monospace,monospace}
.cg-badge{font-size:.65rem;background:var(--primary);color:var(--primary-fg);padding:.1rem .45rem;border-radius:9999px;font-weight:700}
.rt{display:flex;align-items:center;gap:.5rem;padding:.35rem .75rem;border:1px solid var(--border);border-top:none;background:var(--card);font-size:.8rem}
.rt:last-child{border-radius:0 0 var(--r) var(--r)}
.vm{font-weight:700;min-width:3.2rem;text-align:right;font-family:ui-monospace,monospace;font-size:.75rem}
.vm.get{color:var(--success)}.vm.post{color:var(--info)}.vm.patch,.vm.put{color:var(--warning)}.vm.delete{color:var(--danger)}
.rp{font-family:ui-monospace,monospace;color:var(--fg);flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:.75rem}
.rc{font-size:.65rem;color:var(--muted-fg);white-space:nowrap;font-family:ui-monospace,monospace}
.hidden{display:none!important}
</style>
</head>
<body>
<h1>ChepiCare Mobile &mdash; Rutas API</h1>
<p class="sub">App: <code>${esc(data.app)}</code> &middot; Exportado: ${esc(data.exported_at)} &middot; <strong>${totalIncluded} rutas</strong> seleccionadas para la app movil</p>
<div class="bar">
  ${scopeCounts}
  <span class="st"><strong>Total: ${totalIncluded}</strong></span>
</div>
<div class="filters" id="filters"></div>
<div id="app">
${sections}
</div>
<script>
var filter = "all";
var scopes = ["all","public","owner","admin"];
var labels = {all:"Todos",public:"Publico",owner:"Owner",admin:"Admin"};
function renderFilters(){
  var el = document.getElementById("filters");
  el.innerHTML = "";
  scopes.forEach(function(s){
    var b = document.createElement("button");
    b.className = "fil" + (filter === s ? " active" : "");
    b.textContent = labels[s];
    b.onclick = function(){ filter = s; renderFilters(); renderSections(); };
    el.appendChild(b);
  });
}
function renderSections(){
  document.querySelectorAll(".scope-section").forEach(function(sec){
    sec.classList.toggle("hidden", filter !== "all" && sec.dataset.scope !== filter);
  });
}
renderFilters();
renderSections();
</script>
</body>
</html>`;

writeFileSync(join(dir, "mobile-routes.html"), html, "utf8");
console.log(`Generated mobile-routes.md and mobile-routes.html (${totalIncluded} routes)`);
