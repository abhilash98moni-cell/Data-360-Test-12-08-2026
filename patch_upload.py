import sys
with open('src/components/EvidenceManagementView.tsx', 'r') as f:
    content = f.read()

content = content.replace("""                      headers: {
                        'x-user-email': currentUser?.email || '',
                        'x-user-role': currentUser?.role || '',
                        'x-user-organization': currentUser?.organization || ''
                      },""", """                      headers: {
                        ...getAuthHeaders(),
                        'x-user-email': currentUser?.email || '',
                        'x-user-role': currentUser?.role || '',
                        'x-user-organization': currentUser?.organization || ''
                      },""")
with open('src/components/EvidenceManagementView.tsx', 'w') as f:
    f.write(content)
