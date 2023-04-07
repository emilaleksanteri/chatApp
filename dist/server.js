"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { createServer } = require('http');
const ws_1 = require("ws");
const { parse } = require('url');
const next = require('next');
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();
const port = 3003;
app.prepare().then(() => {
    const server = createServer((req, res) => handle(req, res, parse(req.url, true)));
    const wss = new ws_1.WebSocket.Server({ noServer: true });
    wss.on('connection', async function connection(ws) {
        console.log('incoming connection', ws);
        ws.onclose = () => {
            console.log('connection closed', wss.clients.size);
        };
        ws.on('message', function message(data, isBinary) {
            wss.clients.forEach(function each(client) {
                if (client.readyState === ws_1.WebSocket.OPEN) {
                    client.send(data, { binary: isBinary });
                }
            });
        });
    });
    server.on('upgrade', function (req, socket, head) {
        const { pathname } = parse(req.url, true);
        if (pathname !== '/_next/webpack-hmr') {
            wss.handleUpgrade(req, socket, head, function done(ws) {
                wss.emit('connection', ws, req);
            });
        }
    });
    server.listen(port, (err) => {
        if (err)
            throw err;
        console.log(`> Ready on http://localhost:${port} and ws://localhost:${port}`);
    });
});
