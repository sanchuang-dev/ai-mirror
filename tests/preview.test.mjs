import assert from 'node:assert/strict';
import { once } from 'node:events';
import test from 'node:test';
import { createPreviewServer } from '../scripts/preview.mjs';

test('real HTTP preview serves HTML, module and tokens, rejects missing/outside paths', async () => {
  const server = createPreviewServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    const address = server.address();
    assert.ok(address && typeof address === 'object');
    const base = 'http://127.0.0.1:' + address.port;
    const page = await fetch(base);
    assert.equal(page.status, 200);
    assert.match(await page.text(), /<script type="module" src=".\/assets\/app.js"/);

    const module = await fetch(base + '/assets/app.js');
    assert.equal(module.status, 200);
    assert.match(module.headers.get('content-type'), /text\/javascript/);
    assert.match(await module.text(), /mountHome/);

    const style = await fetch(base + '/assets/tokens.css');
    assert.equal(style.status, 200);
    assert.match(await style.text(), /data-dir='b'/);

    const components = await fetch(base + '/assets/components.css');
    assert.equal(components.status, 200);
    assert.match(components.headers.get('content-type'), /text\/css/);

    // H01 影像复用 OpenDesign 素材：预览服务器必须以图片 MIME 提供，否则浏览器拒载。
    const image = await fetch(base + '/assets/img/art-reading.jpg');
    assert.equal(image.status, 200);
    assert.match(image.headers.get('content-type'), /image\/jpeg/);

    const homePage = await fetch(base + '/pages/home.js');
    assert.equal(homePage.status, 200);
    assert.match(await homePage.text(), /renderHome/);

    const api = await fetch(base + '/data/api.js');
    assert.equal(api.status, 200);
    assert.match(await api.text(), /getHomeContent/);

    const fixture = await fetch(base + '/data/fixtures/home.fixture.js');
    assert.equal(fixture.status, 200);
    assert.match(await fixture.text(), /homeFixture/);

    const missing = await fetch(base + '/this-does-not-exist');
    assert.equal(missing.status, 404);
    const outside = await fetch(base + '/%2e%2e%2fpackage.json');
    assert.notEqual(outside.status, 200);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
