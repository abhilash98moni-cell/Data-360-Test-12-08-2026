import sys

with open('src/components/EvidenceManagementView.tsx', 'r') as f:
    content = f.read()

# Add getAuthHeaders to the top
auth_helper = """
const getAuthHeaders = () => {
  const token = typeof window !== "undefined" ? (localStorage.getItem("supabase_token") || sessionStorage.getItem("supabase_token")) : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
};
"""

content = content.replace("import React,", auth_helper + "\\nimport React,")

# Now replace headers in fetch
content = content.replace("""        headers: {
          'x-user-email': currentUser?.email || '',
          'x-user-role': currentUser?.role || '',
          'x-user-organization': currentUser?.organization || ''
        }""", """        headers: {
          ...getAuthHeaders(),
          'x-user-email': currentUser?.email || '',
          'x-user-role': currentUser?.role || '',
          'x-user-organization': currentUser?.organization || ''
        }""")

content = content.replace("""        headers: { 
          'Content-Type': 'application/json',
          'x-user-email': currentUser?.email || '',
          'x-user-role': currentUser?.role || '',
          'x-user-organization': currentUser?.organization || ''
        }""", """        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
          'x-user-email': currentUser?.email || '',
          'x-user-role': currentUser?.role || '',
          'x-user-organization': currentUser?.organization || ''
        }""")

with open('src/components/EvidenceManagementView.tsx', 'w') as f:
    f.write(content)
print("patched")
