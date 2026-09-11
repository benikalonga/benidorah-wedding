// Custom Next.js server with an attached Socket.IO instance for the
// live Wish Wall and Share-a-Moment feeds. Next.js App Router route
// handlers can't hold a persistent WebSocket connection, so this small
// wrapper is the one deliberate deviation from a plain `next start`.
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOST || '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    path: '/socket.io',
    cors: { origin: process.env.SITE_URL || '*' },
  });

  io.on('connection', (socket) => {
    socket.on('disconnect', () => {});
  });

  // Exposed so API route handlers (running in the same Node process)
  // can broadcast without re-implementing a pub/sub layer.
  global.__benidorahIO = io;

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> benidorah ready on http://${hostname}:${port} (${dev ? 'dev' : 'prod'})`);
    });
});
