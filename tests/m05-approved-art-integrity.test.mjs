import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const entries = JSON.parse(readFileSync(resolve(root, 'web/approved-interfaces.json'), 'utf8'));
const expected = [1, 2, 3, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
const byNumber = new Map(entries.map(item => [item.number, item]));

test('catálogo contém as 16 posições, sem duplicatas', () => {
  assert.equal(entries.length, 16);
  assert.equal(byNumber.size, 16);
  for (let n = 1; n <= 16; n++) assert.ok(byNumber.has(n), 'Tela ' + n);
});

test('Tela 04 não é substituída automaticamente; Tela 08 reutiliza Tela 06', () => {
  assert.equal(byNumber.get(4).src, null);
  assert.equal(byNumber.get(8).src, byNumber.get(6).src);
});

for (const number of expected) {
  test('arte aprovada ' + String(number).padStart(2, '0') + ' íntegra', () => {
    const entry = byNumber.get(number);
    assert.ok(entry?.src, 'Arquivo declarado');
    assert.match(entry.sha256, /^[a-f0-9]{64}$/);
    const path = resolve(root, 'web', entry.src);
    assert.ok(existsSync(path), 'Arquivo ausente: ' + entry.src);
    const bytes = readFileSync(path);
    assert.ok(bytes.length > 1000, 'Arquivo muito pequeno: ' + entry.src);
    const png = bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
    const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    assert.ok(png || jpeg, 'Assinatura inválida: ' + entry.src);
    const actual = createHash('sha256').update(bytes).digest('hex');
    assert.equal(actual, entry.sha256, 'SHA-256 diferente: ' + entry.src);
  });
}
