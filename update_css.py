import re

with open('src/index.css', 'r') as f:
    content = f.read()

new_rules = """/* MAIN CARDS (FFFFFF) */
/* -------------------------------------------------- */
.light-theme .bg-slate-900,
.light-theme .bg-slate-850,
.light-theme .from-slate-900 {
  background-color: #FFFFFF !important;
  background-image: none !important;
  box-shadow: 0 1px 3px 0 rgba(37, 99, 235, 0.05), 0 1px 2px -1px rgba(37, 99, 235, 0.05) !important;
}"""

content = content.replace("/* MAIN CARDS (FFFFFF) */\n/* -------------------------------------------------- */\n.light-theme .bg-slate-900,\n.light-theme .bg-slate-850 {\n  background-color: #FFFFFF !important;\n  box-shadow: 0 1px 3px 0 rgba(37, 99, 235, 0.05), 0 1px 2px -1px rgba(37, 99, 235, 0.05) !important;\n}", new_rules)

with open('src/index.css', 'w') as f:
    f.write(content)
