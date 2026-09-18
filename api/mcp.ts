export default async function handler(req: any, res: any) {
  // CORS Headers for AI clients (Claude Desktop, Cursor, Python, ElizaOS)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  const authHeader = req.headers?.authorization || req.headers?.Authorization;
  const token = (typeof authHeader === 'string' ? authHeader.replace(/^Bearer\s+/i, '') : null) || 
    req.query?.token || 
    req.query?.sessionKey;

  const { McpServerService, MCP_TOOLS } = await import('../src/services/mcpServerService.ts');

  // Health check & capability introspection (GET)
  if (req.method === 'GET') {
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
      supportedTools: MCP_TOOLS.map((t: any) => ({ name: t.name, description: t.description })),
      usage: 'Send JSON-RPC 2.0 POST requests with Authorization: Bearer <sessionToken> or ?token=<sessionToken>'
    }, null, 2));
  }

  // JSON-RPC 2.0 Command Execution (POST)
  if (req.method === 'POST') {
    try {
      let body = req.body;
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch (_) {}
      }

      const jsonRpcResponse = await McpServerService.handleJsonRpc(body || {}, token);
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = jsonRpcResponse.error?.code === -32001 ? 401 : 200;
      return res.end(JSON.stringify(jsonRpcResponse, null, 2));
    } catch (err: any) {
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 400;
      return res.end(JSON.stringify({
        jsonrpc: '2.0',
        id: null,
        error: { code: -32700, message: 'Parse error: ' + (err.message || String(err)) }
      }));
    }
  }

  res.statusCode = 405;
  return res.end('Method Not Allowed');
}
