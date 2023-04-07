const { createServer } = require('http');
import { IncomingMessage } from 'http';
import { Duplex } from 'stream';
import { WebSocket } from 'ws';
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();
const port = 3003;

app.prepare().then(() => {
  const server = createServer((req: { url: any }, res: any) =>
    handle(req, res, parse(req.url, true))
  );
  const wss = new WebSocket.Server({ noServer: true });

  wss.on('connection', async function connection(ws) {
    console.log('incoming connection');
    ws.onclose = () => {
      console.log('connection closed');
    };

    ws.on('message', function message(data, isBinary) {
      wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(data, { binary: isBinary });
        }
      });
    });
  });

  server.on(
    'upgrade',
    function (req: IncomingMessage, socket: Duplex, head: Buffer) {
      const { pathname } = parse(req.url, true);
      if (pathname !== '/_next/webpack-hmr') {
        wss.handleUpgrade(req, socket, head, function done(ws) {
          wss.emit('connection', ws, req);
        });
      }
    }
  );

  server.listen(port, (err: string) => {
    if (err) throw err;
    console.log(
      `> Ready on http://localhost:${port} and ws://localhost:${port}`
    );
  });
});
