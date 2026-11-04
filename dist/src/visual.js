import { semanticPhysicalJoins } from './semantic.js';
import { orientPrintedPorts, portValue } from './port-values.js';
/** Printed half centers follow the physical long axis; doubles remain transverse. */
export function printedHalves(p, shape, tile) {
    if (tile.id !== p.tileId || !((tile.a === p.joined && tile.b === p.exposed) || (tile.b === p.joined && tile.a === p.exposed)))
        return null;
    const r = shape.angle * Math.PI / 180;
    const dx = Math.cos(r) * shape.width / 4, dy = Math.sin(r) * shape.width / 4;
    return { tileId: tile.id, joined: p.joined, exposed: p.exposed, halves: [
            { value: p.joined, center: { x: shape.center.x - dx, y: shape.center.y - dy } },
            { value: p.exposed, center: { x: shape.center.x + dx, y: shape.center.y + dy } }
        ] };
}
/** The printed order is derived from the audited physical ports, not from the
 * play-side label. Null means the renderer must not present it as verified. */
export function printedChain(placements, shapes, byId) {
    if (!semanticPhysicalJoins(placements, shapes, byId))
        return null;
    const orientations = orientPrintedPorts(placements, shapes, byId);
    if (!orientations)
        return null;
    const result = [];
    for (let i = 0; i < placements.length; i++) {
        const p = placements[i], shape = shapes[i], tile = byId.get(p.tileId);
        if (!tile)
            return null;
        const reverse = orientations.get(tile.id) ?? false;
        const negative = portValue(tile, shape, 1, reverse), positive = portValue(tile, shape, 0, reverse);
        if (!negative || !positive)
            return null;
        const r = shape.angle * Math.PI / 180, dx = Math.cos(r) * shape.width / 4, dy = Math.sin(r) * shape.width / 4;
        result.push({ tileId: tile.id, joined: p.joined, exposed: p.exposed, halves: [
                { value: negative.value, center: { x: shape.center.x - dx, y: shape.center.y - dy } },
                { value: positive.value, center: { x: shape.center.x + dx, y: shape.center.y + dy } }
            ] });
    }
    return result;
}
