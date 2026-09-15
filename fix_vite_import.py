with open("server.ts", "r") as f:
    content = f.read()

content = content.replace("import { createServer as createViteServer } from 'vite';", "")
content = content.replace("const vite = await createViteServer({", "const { createServer: createViteServer } = await import('vite');\n    const vite = await createViteServer({")

with open("server.ts", "w") as f:
    f.write(content)
