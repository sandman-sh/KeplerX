import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

function mcpServerPlugin() {
  const mcpMiddleware = async (req: any, res: any, next: any) => {
    if (!req.url?.startsWith('/api/mcp')) {
      return next();
    }

    // Enable CORS for external AI agents (Claude, Cursor, Python bots)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      return res.end();
    }

    const parsedUrl = new URL(req.url, 'http://localhost:3000');
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, '') || 
      parsedUrl.searchParams.get('token') || 
      parsedUrl.searchParams.get('sessionKey');

    if (req.method === 'GET') {
      try {
        const { McpServerService, MCP_TOOLS } = await import('./src/services/mcpServerService.ts');
        const session = McpServerService.getSession(token);

        if (token && !session) {
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 401;
          return res.end(JSON.stringify({
            error: '401 Unauthorized: Invalid or tampered MCP session token.',
            detail: 'Session tokens must be valid 256-bit cryptographically secure identifiers (mcp_sess_<64_hex_chars>).'
          }, null, 2));
        }

        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 200;
        return res.end(JSON.stringify({
          status: 'OPERATIONAL',
          protocol: 'Model Context Protocol (JSON-RPC 2.0)',
          server: 'keplerx-mcp-gateway',
          version: '1.0.0',
          authenticated: Boolean(session),
          sessionToken: session ? session.token : null,
          agentAddress: session ? session.agentAddress : null,
          supportedTools: MCP_TOOLS.map(t => ({ name: t.name, description: t.description })),
          usage: 'Send JSON-RPC 2.0 POST requests with Authorization: Bearer <sessionToken> or ?token=<sessionToken>'
        }, null, 2));
      } catch (err: any) {
        res.statusCode = 500;
        return res.end(JSON.stringify({ error: err.message }));
      }
    }

    if (req.method === 'POST') {
      let body = '';
      req.on('data', (chunk: any) => { body += chunk; });
      req.on('end', async () => {
        try {
          const { McpServerService } = await import('./src/services/mcpServerService.ts');
          const jsonRpcRequest = JSON.parse(body || '{}');
          const jsonRpcResponse = await McpServerService.handleJsonRpc(jsonRpcRequest, token);
          
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = jsonRpcResponse.error?.code === -32001 ? 401 : 200;
          res.end(JSON.stringify(jsonRpcResponse, null, 2));
        } catch (err: any) {
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 400;
          res.end(JSON.stringify({
            jsonrpc: '2.0',
            id: null,
            error: { code: -32700, message: 'Parse error: ' + (err.message || String(err)) }
          }));
        }
      });
      return;
    }

    next();
  };

  return {
    name: 'mcp-server-plugin',
    configureServer(server: any) {
      server.middlewares.use(mcpMiddleware);
    },
    configurePreviewServer(server: any) {
      server.middlewares.use(mcpMiddleware);
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    mcpServerPlugin()
  ],
  server: {
    port: 3000,
    host: true
  },
  preview: {
    port: 3000,
    host: true
  }
});
