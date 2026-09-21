// Custom Next.js server with an attached Socket.IO instance for the
// live Wish Wall and Share-a-Moment feeds. Next.js App Router route
// handlers can't hold a persistent WebSocket connection, so this small
// wrapper is the one deliberate deviation from a plain `next start`.
const { createServer } = require('http');
const { parse } = require('url');
const path = require('path');
const fs = require('fs');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOST || '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Production never reaches this: nginx serves /uploads/ directly off the
// shared volume (see nginx/benidorah.conf) and this process never even
// sees those requests. In dev there's no nginx in front, so without this
// guests' uploaded moments/gifts 404 and there's no way to visually test
// the feature locally.
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
const EXT_CONTENT_TYPES = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.heic': 'image/heic',
  '.mp4': 'video/mp4',
  '.mov': 'video/quicktime',
  '.webm': 'video/webm',
};

function serveDevUpload(req, res) {
  const parsedUrl = parse(req.url);
  const relativePath = decodeURIComponent(parsedUrl.pathname.replace(/^\/uploads\//, ''));
  const filePath = path.join(UPLOAD_DIR, relativePath);
  // Refuse anything that escapes UPLOAD_DIR (e.g. via `..` segments).
  if (!filePath.startsWith(path.join(UPLOAD_DIR, path.sep)) && filePath !== UPLOAD_DIR) {
    res.writeHead(400).end('Bad request');
    return;
  }
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404).end('Not found');
      return;
    }
    const contentType = EXT_CONTENT_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'no-store' });
    res.end(data);
  });
}

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    if (dev && req.url.startsWith('/uploads/')) {
      serveDevUpload(req, res);
      return;
    }
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
