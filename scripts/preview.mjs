import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../web/', import.meta.url)));
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
};

export function createPreviewServer() {
  return createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname);
      const file = resolve(
        ROOT,
        '.' + (pathname.endsWith('/') ? pathname + 'index.html' : pathname),
      );
      if (!file.startsWith(ROOT + sep)) {
        response.writeHead(403);
        response.end('Forbidden');
        return;
      }

      const contents = await readFile(file);
      response.writeHead(200, {
        'Content-Type': MIME[extname(file)] ?? 'application/octet-stream',
        'X-Content-Type-Options': 'nosniff',
      });
      response.end(contents);
    } catch (error) {
      const status =
        error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT'
          ? 404
          : 400;
      response.writeHead(status);
      response.end(status === 404 ? 'Not found' : 'Invalid request');
    }
  });
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const port = Number(process.env.PORT ?? '4173');
  createPreviewServer().listen(port, '127.0.0.1', () => {
    console.log('Jianqu engineering preview: http://127.0.0.1:' + port + '/');
  });
}
