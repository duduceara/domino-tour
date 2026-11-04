import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// Executes the actual drawBoard() implementation with a minimal DOM.
// Visual appearance on a physical phone remains a separate acceptance step.
const source = readFileSync(new URL('../web/app.js', import.meta.url), 'utf8');
const start = source.indexOf('function drawBoard(');
const end = source.indexOf('\nfunction sync()', start);
assert.ok(start >= 0 && end > start, 'drawBoard function must exist');

function render(height, width = height * 2) {
  const children = [];
  const surface = {
    clientWidth: 800, clientHeight: 430, dataset: {},
    replaceChildren() { children.length = 0; },
    append(child) { children.push(child); }
  };
  const makeElement = tag => ({
    tag, style: {}, dataset: {}, children: [], disabled: false,
    setAttribute() {}, append(child) { this.children.push(child); },
    replaceChildren(...items) { this.children = items; }
  });
  const shape = { center: { x: 200, y: 150 }, width, height, angle: 90 };
  const model = {
    status: 'verified',
    geometry: { endpoints: { left: { x: 100, y: 150 }, right: { x: 300, y: 150 } } },
    nodes: [{ tileId: 5, official: { id: 5, a: 1, b: 4 }, printed: [1, 4], shape, order: 0 }]
  };
  const ctx = {
    document: { createElement: makeElement },
    $: id => id === 'table' ? surface : null,
    zoom: 1, pan: { x: 0, y: 0 },
    tableSpace: { scale: 1, width: 800, height: 430 },
    game: { state: { turn: 1 }, interaction: { selectedTile: null } },
    validSides: () => [],
    afterAction() {},
    tileEl(tile, css = '') {
      const el = makeElement('button');
      el.className = 'piece ' + css;
      el.dataset.tileId = tile.id;
      el.setAttribute('aria-label', 'Pedra ' + tile.a + ' e ' + tile.b);
      return el;
    }
  };
  vm.runInNewContext(source.slice(start, end) + '\ndrawBoard(model);', { ...ctx, model });
  const board = children[0];
  const piece = board.children.find(x => x.dataset.tileId === 5);
  return { piece, board, shape };
}

for (const [height, expected] of [[10, 7.2], [20, 14.4], [30, 21.6], [40, 22], [80, 22]]) {
  test('board tile lettering scales without exceeding 22px at height ' + height, () => {
    const { piece, shape } = render(height);
    assert.equal(piece.style.fontSize, expected + 'px');
    assert.equal(piece.style.width, shape.width + 'px');
    assert.equal(piece.style.height, shape.height + 'px');
    assert.equal(piece.style.left, shape.center.x + 'px');
    assert.equal(piece.style.top, shape.center.y + 'px');
    assert.equal(piece.style.transform, 'translate(-50%,-50%) rotate(90deg)');
    assert.equal(piece.disabled, true);
  });
}
