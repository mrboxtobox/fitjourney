// idaraya-live — the relay behind the "live follow" link.
//
// One phone runs the guided session (the host); another follows it (the viewer).
// A session is a Durable Object addressed by its share code. The host connects a
// WebSocket to /session/<code>/host and sends its display state whenever it changes;
// every viewer on /session/<code>/watch receives the latest state on connect and
// every update after that. No accounts, no persistence: when the host disconnects,
// viewers are told the session ended, and the object simply goes idle.

export interface Env {
  LIVE: DurableObjectNamespace;
}

const CODE_RE = /^\/session\/([A-Za-z0-9]{4,12})\/(host|watch)$/;

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    const m = url.pathname.match(CODE_RE);
    if (!m) return new Response('not found', { status: 404 });
    // Codes are case-insensitive: the object is addressed by the uppercased form.
    const id = env.LIVE.idFromName(m[1].toUpperCase());
    return env.LIVE.get(id).fetch(req);
  },
};

// The largest message a host may relay. Display state is a few hundred bytes;
// anything bigger is a bug or abuse, and is dropped rather than broadcast.
const MAX_MESSAGE_BYTES = 8192;

export class LiveSession {
  private host: WebSocket | null = null;
  private viewers = new Set<WebSocket>();
  private last: string | null = null;

  async fetch(req: Request): Promise<Response> {
    if (req.headers.get('Upgrade') !== 'websocket') {
      return new Response('expected websocket', { status: 426 });
    }
    const role = new URL(req.url).pathname.toLowerCase().endsWith('/host') ? 'host' : 'watch';
    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];
    server.accept();

    if (role === 'host') this.acceptHost(server);
    else this.acceptViewer(server);

    return new Response(null, { status: 101, webSocket: client });
  }

  private acceptHost(ws: WebSocket): void {
    // A reconnecting host replaces the previous socket rather than racing it.
    this.host?.close(1000, 'replaced');
    this.host = ws;

    ws.addEventListener('message', (e) => {
      if (typeof e.data !== 'string' || e.data.length > MAX_MESSAGE_BYTES) return;
      this.last = e.data;
      this.broadcast(e.data);
    });

    const end = () => {
      if (this.host !== ws) return; // an old socket dying must not end the new session
      this.host = null;
      this.last = null;
      this.broadcast(JSON.stringify({ kind: 'ended' }));
    };
    ws.addEventListener('close', end);
    ws.addEventListener('error', end);
  }

  private acceptViewer(ws: WebSocket): void {
    this.viewers.add(ws);
    if (this.last) ws.send(this.last);
    else ws.send(JSON.stringify({ kind: 'waiting' }));
    const drop = () => this.viewers.delete(ws);
    ws.addEventListener('close', drop);
    ws.addEventListener('error', drop);
  }

  private broadcast(data: string): void {
    for (const v of this.viewers) {
      try {
        v.send(data);
      } catch {
        this.viewers.delete(v);
      }
    }
  }
}
