import sys
with open('src/components/EvidenceManagementView.tsx', 'r') as f:
    content = f.read()

content = content.replace("};\\nimport React", "};\nimport React")

with open('src/components/EvidenceManagementView.tsx', 'w') as f:
    f.write(content)
