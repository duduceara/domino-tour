import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const css = readFileSync(resolve(root, 'web/layout.css'), 'utf8');
const app = readFileSync(resolve(root, 'web/app.js'), 'utf8');
const html = readFileSync(resolve(root, 'web/index.html'), 'utf8');
const catalog = JSON.parse(readFileSync(resolve(root, 'web/approved-interfaces.json'), 'utf8'));
const rule = selector => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = css.match(new RegExp(escaped + '\\s*\\{([^}]*)\\}'));
  assert.ok(match, 'Missing CSS selector: ' + selector);
  return match[1];
};

test('Mesa Premium: board layer does not intercept pointer events', () => {
  assert.match(rule('.board-layer'), /pointer-events\s*:\s*none/);
});
test('Mesa Premium: playable endpoints retain pointer interaction', () => {
  assert.match(rule('.board-layer>.endpoint'), /pointer-events\s*:\s*auto/);
});
test('Mesa Premium: disabled endpoints cannot intercept touches', () => {
  assert.match(rule('.board-layer>.endpoint:disabled'), /pointer-events\s*:\s*none/);
});
test('Mesa Premium: floating dragged tile cannot intercept touches', () => {
  assert.match(rule('.piece.drag-floating'), /pointer-events\s*:\s*none/);
});
test('Mesa Premium: hand retains touch gesture handling', () => {
  assert.match(rule('.hand'), /touch-action\s*:\s*none/);
});
test('Mesa Premium: pointer drag lifecycle remains wired', () => {
  for (const event of ['pointerdown', 'pointermove', 'pointerup'])
    assert.ok(app.includes(event), 'Missing pointer event: ' + event);
});
test('Mesa Premium: geometry and coordinate conversion remain present', () => {
  for (const name of ['fittedTableSpace', 'tablePoint', 'framePoint'])
    assert.ok(app.includes(name), 'Missing geometry function: ' + name);
});
test('Mesa Premium: score, table and hand elements remain mounted', () => {
  for (const id of ['scores', 'table', 'hand'])
    assert.ok(html.includes('id="' + id + '"'), 'Missing DOM id: ' + id);
  assert.ok(app.includes("$('scores').replaceChildren"), 'Score updates missing');
});
test('Mesa Premium: approved image 08 reuses image 06', () => {
  const six = catalog.find(entry => entry.number === 6);
  const eight = catalog.find(entry => entry.number === 8);
  assert.ok(six?.src);
  assert.equal(eight?.src, six.src);
});
test('Mesa Premium: unconfirmed image 04 remains unassigned', () => {
  assert.equal(catalog.find(entry => entry.number === 4)?.src, null);
});
