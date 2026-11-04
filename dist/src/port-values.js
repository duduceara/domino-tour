import { touchingPorts } from './semantic.js';
/** The two short-end ports of a rectangular domino correspond to printed halves.
 * Side ports cover both halves: only doubles have an unambiguous value there.
 */
export function portValue(tile, shape, port, reverse = false, contact) {
    if (tile.id !== shape.tileId || !Number.isInteger(port) || port < 0 || port > 3)
        return null;
    if (port === 0 || port === 1) {
        const half = (port === 0) !== reverse ? 1 : 0;
        return { port, value: half === 0 ? tile.a : tile.b, half };
    }
    if (tile.a === tile.b)
        return { port, value: tile.a, half: 0 };
    if (!contact)
        return null;
    const r = shape.angle * Math.PI / 180, project = (p) => (p.x - shape.center.x) * Math.cos(r) + (p.y - shape.center.y) * Math.sin(r);
    const low = Math.min(project(contact.start), project(contact.end)), high = Math.max(project(contact.start), project(contact.end));
    let half;
    if (low >= -1e-5 && high > 1e-5)
        half = 1;
    else if (high <= 1e-5 && low < -1e-5)
        half = 0;
    else
        return null;
    if (reverse)
        half = half === 0 ? 1 : 0;
    return { port, value: half === 0 ? tile.a : tile.b, half };
}
/** Verify that the physically touching printed half has the required pip.
 * Returns false rather than guessing a rotation or silently reversing artwork.
 */
export function auditPrintedPorts(placements, shapes, tiles, reversed = new Map()) {
    if (!placements.length || placements.length !== shapes.length)
        return false;
    const last = { left: 0, right: 0 };
    for (let i = 0; i < placements.length; i++) {
        const p = placements[i], shape = shapes[i], tile = tiles.get(p.tileId);
        if (!tile || shape.tileId !== p.tileId)
            return false;
        if (i === 0) {
            last.left = 0;
            last.right = 0;
            continue;
        }
        const prior = shapes[last[p.side]], priorTile = tiles.get(prior.tileId);
        if (!priorTile)
            return false;
        const ports = touchingPorts(prior, shape);
        if (!ports)
            return false;
        if (priorTile.a === priorTile.b && ports.a < 2 || tile.a === tile.b && ports.b < 2)
            return false;
        const previousValue = portValue(priorTile, prior, ports.a, reversed.get(prior.tileId) ?? false, ports);
        const currentValue = portValue(tile, shape, ports.b, reversed.get(tile.id) ?? false, ports);
        if (!previousValue || !currentValue || previousValue.value !== p.joined || currentValue.value !== p.joined)
            return false;
        last[p.side] = i;
    }
    return true;
}
/** Compute a physical orientation for each printed non-double, if one exists.
 * Doubles are symmetric. Ambiguous lateral contacts on non-doubles fail closed.
 */
export function orientPrintedPorts(placements, shapes, tiles) {
    if (!placements.length || placements.length !== shapes.length)
        return null;
    const choices = new Map();
    for (const p of placements) {
        const t = tiles.get(p.tileId);
        if (!t)
            return null;
        choices.set(t.id, t.a === t.b ? [false] : [false, true]);
    }
    const last = { left: 0, right: 0 };
    const constraints = [];
    for (let i = 1; i < placements.length; i++) {
        const p = placements[i], j = last[p.side], ports = touchingPorts(shapes[j], shapes[i]);
        if (!ports)
            return null;
        constraints.push({ a: placements[j].tileId, b: p.tileId, pa: ports.a, pb: ports.b, value: p.joined, contact: ports });
        last[p.side] = i;
    }
    const assigned = new Map();
    for (const p of placements) {
        const tile = tiles.get(p.tileId), shape = shapes.find(s => s.tileId === p.tileId);
        const possible = choices.get(p.tileId).filter(reverse => constraints.every(c => {
            if (c.a !== p.tileId && c.b !== p.tileId)
                return true;
            const port = c.a === p.tileId ? c.pa : c.pb;
            return portValue(tile, shape, port, reverse, c.contact)?.value === c.value;
        }));
        if (!possible.length)
            return null;
        assigned.set(p.tileId, possible[0]);
    }
    return auditPrintedPorts(placements, shapes, tiles, assigned) ? assigned : null;
}
