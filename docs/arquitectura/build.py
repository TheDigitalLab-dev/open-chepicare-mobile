#!/usr/bin/env python3
"""
Generador de la documentación de arquitectura de ChepiCare Mobile.

Produce un HTML autocontenido por módulo en `docs/arquitectura/`. Cada archivo
comparte un "shell" común (estilos + Mermaid + lightbox con zoom) e incluye el
contenido específico del módulo. Los diagramas Mermaid se amplían al hacer click.

Uso:  python3 docs/arquitectura/build.py
"""
from __future__ import annotations
import os

from helpers import h

OUT_DIR = os.path.dirname(os.path.abspath(__file__))

# --- Navegación (orden del menú lateral) -----------------------------------
NAV = [
    ("index", "Inicio"),
    ("vision-general", "Visión general"),
    ("navegacion", "Navegación y roles"),
    ("sesion-autenticacion", "Sesión y autenticación"),
    ("capa-http", "Capa HTTP"),
    ("configuracion-servidor", "Configuración de servidor"),
    ("servicios-dominio", "Servicios de dominio"),
    ("pantallas-publico", "Área pública"),
    ("pantallas-owner", "Área del dueño"),
    ("pantallas-admin", "Área del staff"),
    ("componentes-ui", "Componentes y tema"),
    ("estado-datos", "Estado, datos y hooks"),
    ("local-first", "Local-first y sincronización"),
    ("testing", "Testing y calidad"),
]

# --- Shell HTML -------------------------------------------------------------

STYLE = """
:root{
  --bg:#f7f6f2; --panel:#ffffff; --ink:#1f2a2e; --muted:#5b6b70; --line:#e4e2da;
  --brand:#2bb3a3; --brand-ink:#0f766e; --code:#0b1f24; --code-bg:#f0efe9;
  --accent:#eaf7f5; --shadow:0 1px 3px rgba(0,0,0,.06),0 8px 24px rgba(0,0,0,.05);
}
@media (prefers-color-scheme: dark){
  :root{ --bg:#0e1416; --panel:#151d20; --ink:#e6ebec; --muted:#93a2a6; --line:#243033;
    --brand:#34d1bf; --brand-ink:#7fe6d8; --code:#d7e3e6; --code-bg:#0c1518; --accent:#132a2a; }
}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;background:var(--bg);color:var(--ink);
  font:16px/1.65 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
.layout{display:grid;grid-template-columns:280px minmax(0,1fr);min-height:100vh}
aside{position:sticky;top:0;align-self:start;height:100vh;overflow-y:auto;
  background:var(--panel);border-right:1px solid var(--line);padding:22px 16px}
aside .brand{display:flex;align-items:center;gap:10px;font-weight:800;font-size:19px;
  color:var(--brand-ink);margin:4px 8px 18px}
aside .brand .dot{width:12px;height:12px;border-radius:50%;background:var(--brand)}
aside nav a{display:block;padding:9px 12px;border-radius:9px;color:var(--ink);
  text-decoration:none;font-size:14.5px;margin:2px 0}
aside nav a:hover{background:var(--accent)}
aside nav a.active{background:var(--brand);color:#062e2a;font-weight:700}
aside .meta{margin:16px 8px 0;color:var(--muted);font-size:12px;line-height:1.5}
main{padding:40px min(6vw,64px) 96px;max-width:1000px}
h1{font-size:33px;line-height:1.2;margin:0 0 6px}
.subtitle{color:var(--muted);font-size:17px;margin:0 0 26px}
h2{font-size:23px;margin:44px 0 12px;padding-top:8px;border-top:1px solid var(--line)}
section:first-of-type h2{border-top:0}
h3{font-size:18px;margin:26px 0 8px}
p{margin:10px 0}
ul,ol{margin:10px 0;padding-left:22px}
li{margin:5px 0}
code{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:13.5px;
  background:var(--code-bg);color:var(--code);padding:2px 6px;border-radius:6px}
pre.code{background:var(--code-bg);color:var(--code);padding:14px 16px;border-radius:12px;
  overflow:auto;border:1px solid var(--line);font-size:13px;line-height:1.55}
a{color:var(--brand-ink)}
table{width:100%;border-collapse:collapse;margin:14px 0;font-size:14px;
  background:var(--panel);border:1px solid var(--line);border-radius:12px;overflow:hidden}
th,td{text-align:left;padding:10px 12px;border-bottom:1px solid var(--line);vertical-align:top}
th{background:var(--accent);font-weight:700}
tr:last-child td{border-bottom:0}
.callout{display:flex;gap:12px;background:var(--panel);border:1px solid var(--line);
  border-left:4px solid var(--brand);border-radius:12px;padding:12px 14px;margin:16px 0;box-shadow:var(--shadow)}
.callout .ic{font-size:18px}
.callout.warn{border-left-color:#e0a800}.callout.ok{border-left-color:#37b24d}
.callout.tip{border-left-color:#4c6ef5}
.diagram{margin:22px 0;background:var(--panel);border:1px solid var(--line);border-radius:14px;
  padding:18px;box-shadow:var(--shadow);cursor:zoom-in}
.diagram .mermaid{display:flex;justify-content:center;overflow:auto}
.diagram figcaption{text-align:center;margin-top:10px}
.zoom-hint{font-size:12.5px;color:var(--muted);background:var(--accent);
  padding:3px 10px;border-radius:999px}
.cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:14px;margin:16px 0}
.card{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:16px;
  text-decoration:none;color:var(--ink);box-shadow:var(--shadow);display:block}
.card:hover{border-color:var(--brand)}
.card b{display:block;color:var(--brand-ink);margin-bottom:4px}
.card span{font-size:13.5px;color:var(--muted)}
.pills{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}
.pill{background:var(--accent);border:1px solid var(--line);border-radius:999px;
  padding:4px 12px;font-size:13px}
footer.pager{display:flex;justify-content:space-between;margin-top:52px;
  border-top:1px solid var(--line);padding-top:18px;font-size:14px}
/* Lightbox */
#lightbox{position:fixed;inset:0;background:rgba(6,14,16,.86);display:none;z-index:99;
  flex-direction:column}
#lightbox.open{display:flex}
#lightbox .bar{display:flex;justify-content:space-between;align-items:center;
  padding:12px 18px;color:#dfecec;font-size:14px}
#lightbox .bar button{background:#1c2a2d;color:#fff;border:1px solid #33474b;
  border-radius:9px;padding:8px 14px;cursor:pointer;font-size:14px}
#lightbox-svg{flex:1;overflow:hidden}
#lightbox-svg svg{width:100%;height:100%}
@media (max-width:900px){
  .layout{grid-template-columns:1fr}
  aside{position:static;height:auto;border-right:0;border-bottom:1px solid var(--line)}
  aside{height:auto}
}
"""

SCRIPT = """
mermaid.initialize({startOnLoad:false, theme:'base', securityLevel:'loose',
  themeVariables:{primaryColor:'#eaf7f5', primaryTextColor:'#123', primaryBorderColor:'#2bb3a3',
    lineColor:'#5b6b70', fontSize:'14px'}});
async function render(){ await mermaid.run(); setupZoom(); }
function setupZoom(){
  document.querySelectorAll('.diagram').forEach(fig=>{
    fig.addEventListener('click', ()=>{
      const svg = fig.querySelector('svg'); if(!svg) return; openLightbox(svg);
    });
  });
}
function openLightbox(svg){
  const box=document.getElementById('lightbox');
  const holder=document.getElementById('lightbox-svg');
  holder.innerHTML='';
  const clone=svg.cloneNode(true);
  clone.removeAttribute('style'); clone.removeAttribute('width'); clone.removeAttribute('height');
  holder.appendChild(clone);
  box.classList.add('open');
  if(window.svgPanZoom){ window._pz=svgPanZoom(clone,{controlIconsEnabled:true,fit:true,
    center:true,minZoom:0.2,maxZoom:30,zoomScaleSensitivity:.4}); }
}
function closeLightbox(){
  const box=document.getElementById('lightbox');
  if(window._pz){ try{window._pz.destroy();}catch(e){} window._pz=null; }
  box.classList.remove('open');
}
document.addEventListener('keydown',e=>{ if(e.key==='Escape') closeLightbox(); });
window.addEventListener('load', render);
"""


def nav_html(active: str) -> str:
    links = "".join(
        f'<a href="{slug}.html" class="{"active" if slug==active else ""}">{h(label)}</a>'
        for slug, label in NAV
    )
    return (
        '<aside><div class="brand"><span class="dot"></span> ChepiCare · Arquitectura</div>'
        f"<nav>{links}</nav>"
        '<div class="meta">Expo SDK 56 · React Native 0.85 · TypeScript estricto.<br>'
        "Generado desde <code>docs/arquitectura/build.py</code>.</div></aside>"
    )


def pager_html(active: str) -> str:
    slugs = [s for s, _ in NAV]
    i = slugs.index(active)
    prev_l = (
        f'<a href="{NAV[i-1][0]}.html">← {h(NAV[i-1][1])}</a>' if i > 0 else "<span></span>"
    )
    next_l = (
        f'<a href="{NAV[i+1][0]}.html">{h(NAV[i+1][1])} →</a>'
        if i < len(NAV) - 1
        else "<span></span>"
    )
    return f'<footer class="pager">{prev_l}{next_l}</footer>'


def page(slug: str, title: str, subtitle: str, content: str) -> str:
    return f"""<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{h(title)} · ChepiCare Mobile</title>
<style>{STYLE}</style>
</head>
<body>
<div class="layout">
{nav_html(slug)}
<main>
<h1>{h(title)}</h1>
<p class="subtitle">{h(subtitle)}</p>
{content}
{pager_html(slug)}
</main>
</div>
<div id="lightbox" onclick="if(event.target.id==='lightbox')closeLightbox()">
  <div class="bar"><span>Arrastra para mover · rueda para zoom · Esc para cerrar</span>
  <button onclick="closeLightbox()">Cerrar ✕</button></div>
  <div id="lightbox-svg"></div>
</div>
<script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/svg-pan-zoom@3.6.1/dist/svg-pan-zoom.min.js"></script>
<script>{SCRIPT}</script>
</body>
</html>"""


# Cada módulo aporta su contenido en un archivo separado del generador.
from paginas import PAGES  # noqa: E402


def main() -> None:
    written = []
    for slug, label in NAV:
        title, subtitle, content = PAGES[slug]
        out = os.path.join(OUT_DIR, f"{slug}.html")
        with open(out, "w", encoding="utf-8") as f:
            f.write(page(slug, title, subtitle, content))
        written.append(f"{slug}.html")
    print("Generados:", ", ".join(written))


if __name__ == "__main__":
    main()
