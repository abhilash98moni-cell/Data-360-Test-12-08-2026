import sys
with open('src/components/SamplingUploadView.tsx', 'r') as f:
    content = f.read()

auth_helper = """
const getAuthHeaders = () => {
  const token = typeof window !== "undefined" ? (localStorage.getItem("supabase_token") || sessionStorage.getItem("supabase_token")) : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
};
"""

content = content.replace("import React,", auth_helper + "\nimport React,")

# Replace fetch headers in SamplingUploadView
content = content.replace("""      const res = await fetch(`/api/sampling/required-data/responses?distributorId=${distParam}&auditId=${auditParam}`, {
        headers: {
          'x-user-email': currentUser?.email || '',
          'x-user-role': currentUser?.role || 'Auditor'
        }
      });""", """      const res = await fetch(`/api/sampling/required-data/responses?distributorId=${distParam}&auditId=${auditParam}`, {
        headers: {
          ...getAuthHeaders(),
          'x-user-email': currentUser?.email || '',
          'x-user-role': currentUser?.role || 'Auditor'
        }
      });""")

content = content.replace("""      const popRes = await fetch(`/api/sampling/populations?distributorId=${distParam}&auditId=${auditParam}&client=${clientParam}`);""", """      const popRes = await fetch(`/api/sampling/populations?distributorId=${distParam}&auditId=${auditParam}&client=${clientParam}`, { headers: getAuthHeaders() });""")

content = content.replace("""      const stateRes = await fetch(`/api/sampling/state?distributorId=${distParam}&auditId=${auditParam}&client=${clientParam}`);""", """      const stateRes = await fetch(`/api/sampling/state?distributorId=${distParam}&auditId=${auditParam}&client=${clientParam}`, { headers: getAuthHeaders() });""")

content = content.replace("""      const recRes = await fetch(`/api/sampling/population-records?fileId=${encodeURIComponent(targetId || '')}&distributorId=${distParam}&auditId=${auditParam}&client=${clientParam}`);""", """      const recRes = await fetch(`/api/sampling/population-records?fileId=${encodeURIComponent(targetId || '')}&distributorId=${distParam}&auditId=${auditParam}&client=${clientParam}`, { headers: getAuthHeaders() });""")

content = content.replace("""      await fetch('/api/sampling/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },""", """      await fetch('/api/sampling/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },""")

content = content.replace("""      const recRes = await fetch(`/api/sampling/population-records?fileId=${encodeURIComponent(fileId)}&distributorId=${distParam}&auditId=${auditParam}`);""", """      const recRes = await fetch(`/api/sampling/population-records?fileId=${encodeURIComponent(fileId)}&distributorId=${distParam}&auditId=${auditParam}`, { headers: getAuthHeaders() });""")

content = content.replace("""      const res = await fetch('/api/sampling/upload', {
        method: 'POST',
        headers: {
          'x-user-email': currentUser?.email || 'auditor@data360.com',
          'x-user-name': currentUser?.name || 'Sarah Jenkins',
          'x-user-role': currentUser?.role || 'Auditor'
        },""", """      const res = await fetch('/api/sampling/upload', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'x-user-email': currentUser?.email || 'auditor@data360.com',
          'x-user-name': currentUser?.name || 'Sarah Jenkins',
          'x-user-role': currentUser?.role || 'Auditor'
        },""")

with open('src/components/SamplingUploadView.tsx', 'w') as f:
    f.write(content)

print("patched sampling upload")
