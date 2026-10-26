// =========================================================================
// server/websocket_server.js - Native Zero-Dependency WebSocket & SSE Engine
// =========================================================================

const crypto = require('crypto');

const WS_MAGIC_STRING = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
const clients = new Set();
const sseClients = new Set();

/**
 * Encodes a string payload into a valid RFC 6455 WebSocket unmasked text frame.
 */
function encodeWebSocketFrame(text) {
  const payload = Buffer.from(text, 'utf8');
  const length = payload.length;

  let header;
  if (length < 126) {
    header = Buffer.alloc(2);
    header[0] = 0x81; // FIN + Opcode 1 (text)
    header[1] = length;
  } else if (length <= 0xffff) {
    header = Buffer.alloc(4);
    header[0] = 0x81;
    header[1] = 126;
    header.writeUInt16BE(length, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x81;
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(length), 2);
  }

  return Buffer.concat([header, payload]);
}

/**
 * Attaches the WebSocket upgrade handler to an existing Node.js HTTP server.
 */
function attachWebSocketServer(httpServer) {
  httpServer.on('upgrade', (req, socket, head) => {
    const pathname = (req.url || '').split('?')[0];
    if (pathname !== '/ws' && pathname !== '/api/live-stream') {
      socket.destroy();
      return;
    }

    const key = req.headers['sec-websocket-key'];
    if (!key) {
      socket.destroy();
      return;
    }

    const acceptKey = crypto
      .createHash('sha1')
      .update(key + WS_MAGIC_STRING)
      .digest('base64');

    const headers = [
      'HTTP/1.1 101 Switching Protocols',
      'Upgrade: websocket',
      'Connection: Upgrade',
      `Sec-WebSocket-Accept: ${acceptKey}`,
      '\r\n'
    ];

    socket.write(headers.join('\r\n'));
    clients.add(socket);

    socket.setKeepAlive(true, 15000);

    // Initial Welcome Message
    const welcome = JSON.stringify({
      type: 'CONNECTED',
      message: 'Connected to eLabAssist LIMS Real-Time Hardware Hub',
      activeClients: clients.size,
      timestamp: new Date().toISOString()
    });
    try {
      socket.write(encodeWebSocketFrame(welcome));
    } catch (e) {}

    // Handle frame reading (pings, close, incoming text)
    socket.on('data', (chunk) => {
      if (chunk.length < 2) return;
      const firstByte = chunk[0];
      const opcode = firstByte & 0x0f;

      // Close frame (opcode 8)
      if (opcode === 8) {
        clients.delete(socket);
        try { socket.end(); } catch (e) {}
        return;
      }

      // Ping frame (opcode 9) -> Respond with Pong (opcode 10)
      if (opcode === 9) {
        const pong = Buffer.from([0x8a, 0x00]);
        try { socket.write(pong); } catch (e) {}
        return;
      }
    });

    socket.on('error', () => {
      clients.delete(socket);
    });

    socket.on('close', () => {
      clients.delete(socket);
    });
  });
}

/**
 * Registers an HTTP Server-Sent Events (SSE) client.
 */
function handleSseConnection(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  const client = { res, id: Date.now() };
  sseClients.add(client);

  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', message: 'SSE Active', timestamp: new Date().toISOString() })}\n\n`);

  req.on('close', () => {
    sseClients.delete(client);
  });
}

/**
 * Broadcasts an event to all connected WebSockets and SSE clients in real-time.
 */
function broadcastLiveSync(eventType, data) {
  const payload = JSON.stringify({
    type: eventType,
    data,
    timestamp: new Date().toISOString()
  });

  const frame = encodeWebSocketFrame(payload);

  for (const client of clients) {
    if (client.writable) {
      try {
        client.write(frame);
      } catch (err) {
        clients.delete(client);
      }
    } else {
      clients.delete(client);
    }
  }

  for (const sse of sseClients) {
    try {
      sse.res.write(`data: ${payload}\n\n`);
    } catch (err) {
      sseClients.delete(sse);
    }
  }
}

function getConnectedClientsCount() {
  return clients.size + sseClients.size;
}

module.exports = {
  attachWebSocketServer,
  handleSseConnection,
  broadcastLiveSync,
  getConnectedClientsCount
};
