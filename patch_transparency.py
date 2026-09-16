import sys

with open('src/index.css', 'r') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if '.light-theme .bg-slate-950\/' in line or '.light-theme .bg-slate-900\/' in line:
        pass # we can just rewrite the secondary surfaces section

# Instead of modifying inline, let's just do a string replacement
content = "".join(lines)

# Replace the block for bg-slate-950 variations
old_950_block = """/* Allow other 950s (like headers and panels) to be F8FAFE (Secondary Surface) */
.light-theme .bg-slate-950,
.light-theme .bg-slate-950\/90,
.light-theme .bg-slate-950\/80,
.light-theme .bg-slate-950\/60,
.light-theme .bg-slate-950\/40,
.light-theme .bg-slate-950\/30,
.light-theme .bg-slate-950\/20,
.light-theme .hover\:bg-slate-950:hover,
.light-theme .focus\:bg-slate-950:focus {
  background-color: #F8FAFE !important;
}"""

new_950_block = """/* Maintain opacity for secondary panels */
.light-theme .bg-slate-950,
.light-theme .hover\:bg-slate-950:hover,
.light-theme .focus\:bg-slate-950:focus {
  background-color: #F8FAFE !important;
}
.light-theme .bg-slate-950\/90 { background-color: rgba(248, 250, 254, 0.9) !important; }
.light-theme .bg-slate-950\/80 { background-color: rgba(248, 250, 254, 0.8) !important; }
.light-theme .bg-slate-950\/60 { background-color: rgba(248, 250, 254, 0.6) !important; }
.light-theme .bg-slate-950\/40 { background-color: rgba(248, 250, 254, 0.4) !important; }
.light-theme .bg-slate-950\/30 { background-color: rgba(248, 250, 254, 0.3) !important; }
.light-theme .bg-slate-950\/20 { background-color: rgba(248, 250, 254, 0.2) !important; }
"""

# Replace for 900
old_900_block = """/* 2. Primary Surfaces (Cards, Modals, KPI Cards, Sidebar, Header) */
.light-theme .bg-slate-900,
.light-theme .bg-slate-900\/90,
.light-theme .bg-slate-900\/80,
.light-theme .bg-slate-900\/60,
.light-theme .bg-slate-900\/50,
.light-theme .bg-slate-900\/40,
.light-theme .bg-slate-850 {
  background-color: #FFFFFF !important;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.03) !important;
}"""

new_900_block = """/* 2. Primary Surfaces (Cards, Modals, KPI Cards, Sidebar, Header) */
.light-theme .bg-slate-900,
.light-theme .bg-slate-850 {
  background-color: #FFFFFF !important;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.03) !important;
}
.light-theme .bg-slate-900\/90 { background-color: rgba(255, 255, 255, 0.9) !important; }
.light-theme .bg-slate-900\/80 { background-color: rgba(255, 255, 255, 0.8) !important; }
.light-theme .bg-slate-900\/60 { background-color: rgba(255, 255, 255, 0.6) !important; }
.light-theme .bg-slate-900\/50 { background-color: rgba(255, 255, 255, 0.5) !important; }
.light-theme .bg-slate-900\/40 { background-color: rgba(255, 255, 255, 0.4) !important; }
"""

# Replace for 800
old_800_block = """/* 3. Secondary Surfaces (Table Headers, Hover States, Search Bars) */
.light-theme .bg-slate-800,
.light-theme .bg-slate-800\/80,
.light-theme .bg-slate-800\/60,
.light-theme .bg-slate-800\/50,
.light-theme .bg-slate-800\/40,
.light-theme .bg-slate-800\/30,
.light-theme .hover\:bg-slate-800:hover,
.light-theme .hover\:bg-slate-800\/80:hover,
.light-theme .hover\:bg-slate-800\/50:hover,
.light-theme .hover\:bg-slate-800\/40:hover,
.light-theme .hover\:bg-slate-800\/30:hover {
  background-color: #F1F6FC !important;
}"""

new_800_block = """/* 3. Secondary Surfaces (Table Headers, Hover States, Search Bars) */
.light-theme .bg-slate-800,
.light-theme .hover\:bg-slate-800:hover {
  background-color: #F1F6FC !important;
}
.light-theme .bg-slate-800\/80, .light-theme .hover\:bg-slate-800\/80:hover { background-color: rgba(241, 246, 252, 0.8) !important; }
.light-theme .bg-slate-800\/60, .light-theme .hover\:bg-slate-800\/60:hover { background-color: rgba(241, 246, 252, 0.6) !important; }
.light-theme .bg-slate-800\/50, .light-theme .hover\:bg-slate-800\/50:hover { background-color: rgba(241, 246, 252, 0.5) !important; }
.light-theme .bg-slate-800\/40, .light-theme .hover\:bg-slate-800\/40:hover { background-color: rgba(241, 246, 252, 0.4) !important; }
.light-theme .bg-slate-800\/30, .light-theme .hover\:bg-slate-800\/30:hover { background-color: rgba(241, 246, 252, 0.3) !important; }
"""

content = content.replace(old_950_block, new_950_block)
content = content.replace(old_900_block, new_900_block)
content = content.replace(old_800_block, new_800_block)

with open('src/index.css', 'w') as f:
    f.write(content)

print("Patched opacity in index.css")
