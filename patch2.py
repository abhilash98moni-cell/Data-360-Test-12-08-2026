import sys

with open('src/index.css', 'r') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if line.startswith('  background-color: #F4F7FC !important;'):
        # insert background-image right after
        lines.insert(i + 1, "  background-image: radial-gradient(circle at 10% 20%, rgba(225, 232, 250, 0.7), transparent 30%), radial-gradient(circle at 90% 80%, rgba(230, 225, 255, 0.6), transparent 40%) !important;\n")
        lines.insert(i + 2, "  background-attachment: fixed !important;\n")
        break

with open('src/index.css', 'w') as f:
    f.writelines(lines)

print("Added subtle gradient to light-theme")
