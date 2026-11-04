import { facePorts } from './table.js';
/** Semantic audit: the exposed pip on a tile must agree with the adjacent tile.
 * This does not infer visual half-pip orientation from a rectangle alone.
 */
export function auditChainValues(placements, tiles) {
    if (!placements.length)
        return false;
    const first = tiles.get(placements[0].tileId);
    if (!first || first.a !== placements[0].joined && first.b !== placements[0].joined)
        return false;
    let left = placements[0].joined, right = placements[0].exposed;
    if (!((first.a === left && first.b === right) || (first.b === left && first.a === right)))
        return false;
    const seen = new Set([first.id]);
    for (let i = 1; i < placements.length; i++) {
        const p = placements[i], tile = tiles.get(p.tileId);
        if (!tile || seen.has(tile.id) || !((tile.a === p.joined && tile.b === p.exposed) || (tile.b === p.joined && tile.a === p.exposed)))
            return false;
        if (p.side === 'left') {
            if (p.joined !== left)
                return false;
            left = p.exposed;
        }
        else {
            if (p.joined !== right)
                return false;
            right = p.exposed;
        }
        seen.add(tile.id);
    }
    return true;
}
/** Check whether two domino rectangles touch along opposite face ports.
 * Returns the physical ports, not an assertion that the printed pips align.
 */
export function touchingPorts(a, b, epsilon = 1e-5) {
    const pa = facePorts(a), pb = facePorts(b);
    for (let i = 0; i < pa.length; i++)
        for (let j = 0; j < pb.length; j++) {
            const x = pa[i], y = pb[j];
            if (Math.abs(x.normal.x + y.normal.x) > epsilon || Math.abs(x.normal.y + y.normal.y) > epsilon)
                continue;
            const d = { x: y.center.x - x.center.x, y: y.center.y - x.center.y };
            const normal = d.x * x.normal.x + d.y * x.normal.y;
            const tangent = -d.x * x.normal.y + d.y * x.normal.x;
            if (Math.abs(normal) <= epsilon) {
                const lo = Math.max(-x.length / 2, tangent - y.length / 2), hi = Math.min(x.length / 2, tangent + y.length / 2);
                if (hi - lo > epsilon) {
                    const tx = -x.normal.y, ty = x.normal.x;
                    return { a: i, b: j, start: { x: x.center.x + tx * lo, y: x.center.y + ty * lo }, end: { x: x.center.x + tx * hi, y: x.center.y + ty * hi } };
                }
            }
        }
    return null;
}
export function semanticPhysicalJoins(placements, physical, tilesById) {
    if (!auditChainValues(placements, tilesById) || placements.length !== physical.length)
        return null;
    const last = { left: 0, right: 0 };
    const joins = [];
    for (let i = 0; i < placements.length; i++) {
        const p = placements[i], tile = physical[i];
        if (!tile || tile.tileId !== p.tileId)
            return null;
        if (i === 0)
            continue;
        const prev = physical[last[p.side]];
        const ports = touchingPorts(prev, tile);
        if (!ports)
            return null;
        joins.push({ tileId: p.tileId, previousId: prev.tileId, side: p.side, joined: p.joined, exposed: p.exposed, previousPort: ports.a, tilePort: ports.b });
        last[p.side] = i;
    }
    return joins;
}
