import { orientPrintedPorts, portValue } from './port-values.js';
import { touchingPorts, auditChainValues } from './semantic.js';
import { play, RuleError } from './engine.js';
export const ROUTE_STYLES = ['classic', 'loop', 'spiral'];
const finite = (v) => Number.isFinite(v);
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const directions = [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 0, y: -1 }];
function branchPath(style) {
    const width = 4, height = 7, start = { x: 3, y: 3 };
    const used = new Set(), result = [];
    const key = (c) => `${c.x},${c.y}`;
    const degree = (c) => directions.filter(d => { const n = { x: c.x + d.x, y: c.y + d.y }; return n.x >= 0 && n.x < width && n.y >= 0 && n.y < height && !used.has(key(n)); }).length;
    const visit = (c) => {
        used.add(key(c));
        result.push(c);
        if (result.length === width * height)
            return true;
        const options = directions.map(d => ({ x: c.x + d.x, y: c.y + d.y })).filter(n => n.x >= 0 && n.x < width && n.y >= 0 && n.y < height && !used.has(key(n)));
        const score = (n) => {
            const remaining = degree(n);
            if (style === 'classic')
                return remaining * 100 + n.y * 2 + n.x;
            if (style === 'loop')
                return remaining * 100 + Math.abs(n.y - 3) * 3 + n.x;
            return (3 - n.x) * 10 + Math.abs(n.y - 3);
        };
        options.sort((a, b) => score(a) - score(b));
        for (const n of options)
            if (visit(n))
                return true;
        used.delete(key(c));
        result.pop();
        return false;
    };
    if (!visit(start))
        throw new RuleError('Route cannot be constructed');
    return result;
}
/** A route is chosen at the start of a round and remains stable for its duration.
 * The caller must retain the chosen style; never reroll on a resize or a play.
 */
export function chooseRoute(randomIndex) {
    const index = randomIndex(ROUTE_STYLES.length);
    if (!Number.isInteger(index) || index < 0 || index >= ROUTE_STYLES.length)
        throw new RuleError('Invalid route random index');
    return ROUTE_STYLES[index];
}
export function layoutTable(placements, bounds, orientation, style = 'classic', tilesById) {
    if (![bounds.x, bounds.y, bounds.width, bounds.height].every(finite) || bounds.width < 120 || bounds.height < 120)
        throw new RuleError('Invalid table bounds');
    if (!ROUTE_STYLES.includes(style))
        throw new RuleError('Invalid route style');
    if (placements.length > 28)
        throw new RuleError('More than 28 tiles');
    const horizontal = orientation === 'horizontal', cols = horizontal ? 9 : 7, rows = horizontal ? 7 : 9;
    const cellW = bounds.width / cols, cellH = bounds.height / rows;
    // Square hitboxes leave adequate clearance for a rotated double (crosswise).
    const sideLength = Math.min(cellW, cellH) * .78;
    const tileWidth = sideLength, tileHeight = sideLength;
    const center = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
    const path = branchPath(style);
    const transform = (branch, index) => {
        if (index >= path.length)
            throw new RuleError('Route capacity exceeded');
        const c = path[index];
        const col = branch === 'left' ? c.x : 8 - c.x;
        const row = c.y;
        const x = horizontal ? col : row, y = horizontal ? row : col;
        return { x: bounds.x + (x + .5) * cellW, y: bounds.y + (y + .5) * cellH };
    };
    const result = [];
    const links = [];
    const branchLast = { left: center, right: center };
    let leftCount = 0, rightCount = 0;
    for (const placement of placements) {
        const isOpening = result.length === 0;
        const point = isOpening ? center : transform(placement.side, placement.side === 'left' ? leftCount++ : rightCount++);
        const tile = tilesById?.get(placement.tileId);
        const double = tile !== undefined && tile.a === tile.b;
        // Doubles are transverse to the local chain; a rendering invariant.
        const previous = branchLast[placement.side];
        if (!isOpening) {
            const distance = dist(previous, point);
            const spacing = Math.min(cellW, cellH);
            if (Math.abs(distance - spacing) > Math.max(0.001, Math.abs(cellW - cellH) + 0.001))
                throw new RuleError('Discontinuous route segment');
            links.push({ from: previous, to: point, side: placement.side });
        }
        // Orient each ordinary tile with its local path tangent. Doubles are
        // transverse. Visual links bridge turn gaps; physical joins need later QA.
        const tangent = isOpening ? (horizontal ? 0 : 90) : Math.atan2(point.y - previous.y, point.x - previous.x) * 180 / Math.PI;
        const angle = Math.round(tangent / 90) * 90 + (double ? 90 : 0);
        result.push({ tileId: placement.tileId, center: point, angle });
        branchLast[placement.side] = point;
    }
    return { bounds, orientation, style, tileWidth, tileHeight, tiles: result, links, endpoints: { left: transform('left', leftCount), right: transform('right', rightCount) } };
}
export function validSides(s, seat, tileId) {
    const tile = s.players[seat].hand.find(t => t.id === tileId);
    if (!tile || s.phase !== 'playing' || s.turn !== seat)
        return [];
    if (s.openingRequiredTileId !== null && tileId !== s.openingRequiredTileId)
        return [];
    if (s.left === null)
        return ['left', 'right'];
    const sides = [];
    if (tile.a === s.left || tile.b === s.left)
        sides.push('left');
    if (tile.a === s.right || tile.b === s.right)
        sides.push('right');
    return sides;
}
/** An input controller with no implicit engine mutation. The caller owns pointer capture.
 * A drag commits only after crossing halfway to a *legal* endpoint. On release before
 * that point it cancels safely. Multi-touch invalidates the gesture.
 */
export class TableInteraction {
    state;
    seat;
    geometry;
    resolver;
    commit;
    selected = null;
    drag = null;
    constructor(state, seat, geometry, resolver, commit) {
        this.state = state;
        this.seat = seat;
        this.geometry = geometry;
        this.resolver = resolver;
        this.commit = commit;
    }
    get selectedTile() { return this.selected; }
    updateGeometry(geometry) { this.geometry = geometry; this.drag = null; }
    select(tileId) {
        if (!validSides(this.state, this.seat, tileId).length)
            return false;
        this.selected = tileId;
        return true;
    }
    preview(tileId, at) {
        const legal = validSides(this.state, this.seat, tileId);
        if (!legal.length)
            return null;
        const side = legal.reduce((best, curr) => dist(at, this.geometry.endpoints[curr]) < dist(at, this.geometry.endpoints[best]) ? curr : best);
        return this.resolver ? this.resolver(tileId, side) : { tileId, side, center: this.geometry.endpoints[side], valid: true };
    }
    /** Tap endpoint after one tile selection. No second tile tap required. */
    tapEndpoint(side) {
        if (this.selected === null || !validSides(this.state, this.seat, this.selected).includes(side))
            return false;
        try {
            if (this.resolver && !this.resolver(this.selected, side))
                return false;
            if (this.commit) {
                if (!this.commit(this.selected, side))
                    return false;
            }
            else
                play(this.state, this.seat, this.selected, side);
            this.selected = null;
            return true;
        }
        catch (error) {
            if (error instanceof RuleError)
                return false;
            throw error;
        }
    }
    begin(pointerId, tileId, at) {
        if (this.drag || !Number.isInteger(pointerId) || !this.select(tileId))
            return false;
        this.drag = { id: pointerId, tileId, start: at, blocked: false };
        return true;
    }
    /** A second pointer cancels the entire gesture, not merely the second pointer. */
    otherPointer(pointerId) { if (this.drag && this.drag.id !== pointerId)
        this.drag.blocked = true; }
    move(pointerId, at) {
        const d = this.drag;
        if (!d || d.id !== pointerId || d.blocked)
            return { preview: null, committed: false };
        const p = this.preview(d.tileId, at);
        if (!p)
            return { preview: null, committed: false };
        const travel = dist(d.start, p.center);
        const moved = dist(d.start, at);
        // Projection, not radial distance: sideways swipes must never auto-play.
        const projection = travel > 0 ? ((at.x - d.start.x) * (p.center.x - d.start.x) + (at.y - d.start.y) * (p.center.y - d.start.y)) / (travel * travel) : 0;
        const lateral = travel > 0 ? Math.abs((at.x - d.start.x) * (p.center.y - d.start.y) - (at.y - d.start.y) * (p.center.x - d.start.x)) / travel : Infinity;
        if (projection >= .5 && lateral <= Math.max(26, Math.min(this.geometry.tileWidth, this.geometry.tileHeight) * 1.5) && moved >= 12) {
            const ok = this.tapEndpoint(p.side);
            this.drag = null;
            return { preview: p, committed: ok };
        }
        return { preview: p, committed: false };
    }
    end(pointerId) { if (this.drag?.id === pointerId) {
        if (this.drag.blocked)
            this.selected = null;
        this.drag = null;
    } }
    cancel() { this.drag = null; this.selected = null; }
}
export function overlapsOriented(a, b, epsilon = 1e-7) {
    const basis = (angle) => { const r = angle * Math.PI / 180; return [{ x: Math.cos(r), y: Math.sin(r) }, { x: -Math.sin(r), y: Math.cos(r) }]; };
    const [au, av] = basis(a.angle), [bu, bv] = basis(b.angle);
    const dot = (u, v) => u.x * v.x + u.y * v.y;
    const d = { x: b.center.x - a.center.x, y: b.center.y - a.center.y };
    for (const axis of [au, av, bu, bv]) {
        const ra = (Math.abs(dot(au, axis)) * a.width + Math.abs(dot(av, axis)) * a.height) / 2;
        const rb = (Math.abs(dot(bu, axis)) * b.width + Math.abs(dot(bv, axis)) * b.height) / 2;
        if (Math.abs(dot(d, axis)) >= ra + rb - epsilon)
            return false;
    }
    return true;
}
/** Exact contact for two rectangular pieces oriented along the same straight run. */
export function attachAtFace(previous, next, direction) {
    const len = Math.hypot(direction.x, direction.y);
    if (len < 1e-9 || !Number.isFinite(len))
        throw new RuleError('Invalid contact direction');
    const n = { x: direction.x / len, y: direction.y / len };
    const support = (t) => {
        const r = t.angle * Math.PI / 180;
        return (Math.abs(n.x * Math.cos(r) + n.y * Math.sin(r)) * t.width +
            Math.abs(-n.x * Math.sin(r) + n.y * Math.cos(r)) * t.height) / 2;
    };
    const gap = support(previous) + support(next);
    return { ...next, center: { x: previous.center.x + n.x * gap, y: previous.center.y + n.y * gap } };
}
/** Validate a complete proposed physical chain before replacing the legacy renderer. */
export function validatePhysicalChain(tiles, bounds) {
    for (let i = 0; i < tiles.length; i++) {
        const t = tiles[i];
        if (![t.center.x, t.center.y, t.width, t.height, t.angle].every(Number.isFinite) || t.width <= 0 || t.height <= 0)
            return false;
        const r = t.angle * Math.PI / 180;
        const ex = (Math.abs(Math.cos(r)) * t.width + Math.abs(Math.sin(r)) * t.height) / 2;
        const ey = (Math.abs(Math.sin(r)) * t.width + Math.abs(Math.cos(r)) * t.height) / 2;
        if (t.center.x - ex < bounds.x - 1e-6 || t.center.x + ex > bounds.x + bounds.width + 1e-6 || t.center.y - ey < bounds.y - 1e-6 || t.center.y + ey > bounds.y + bounds.height + 1e-6)
            return false;
        for (let j = 0; j < i; j++)
            if (overlapsOriented(t, tiles[j]))
                return false;
    }
    return true;
}
/** The target for a new tile is outside the exposed face, not on top of the last tile.
 * The engine's left/right ends are independent of the display orientation.
 */
export function physicalEndpoints(ends, directions) {
    const endpoint = (side) => {
        const t = ends[side], d = directions[side];
        const r = t.angle * Math.PI / 180;
        const support = (Math.abs(d.x * Math.cos(r) + d.y * Math.sin(r)) * t.width + Math.abs(-d.x * Math.sin(r) + d.y * Math.cos(r)) * t.height) / 2;
        return { x: t.center.x + d.x * (support + Math.min(t.width, t.height) * 0.7), y: t.center.y + d.y * (support + Math.min(t.width, t.height) * 0.7) };
    };
    return { left: endpoint('left'), right: endpoint('right') };
}
/** Verify the physical sequence by replaying each branch in placement order. */
export function verifyPhysicalContacts(placements, tiles, epsilon = 1e-5) {
    if (placements.length !== tiles.length || !tiles.length)
        return false;
    const last = { left: 0, right: 0 };
    for (let i = 0; i < tiles.length; i++) {
        if (tiles[i].tileId !== placements[i].tileId)
            return false;
        if (i === 0)
            continue;
        const side = placements[i].side, prev = tiles[last[side]], next = tiles[i];
        if (!faceContact(prev, next, epsilon))
            return false;
        last[side] = i;
    }
    return true;
}
export function physicalLayout(placements, bounds, orientation, style, tilesById, options = {}) {
    const started = performance.now(), metrics = options.metrics ?? { nodes: 0, attempts: 0, elapsedMs: 0, exhausted: false };
    Object.assign(metrics, { nodes: 0, attempts: 0, elapsedMs: 0, exhausted: false });
    const maxNodes = options.maxNodes ?? 18000, maxMillis = options.maxMillis ?? 200;
    if (!Number.isFinite(maxNodes) || !Number.isFinite(maxMillis) || maxNodes < 1 || maxMillis <= 0)
        return null;
    if (!placements.length || placements.length > 28 || ![bounds.x, bounds.y, bounds.width, bounds.height].every(Number.isFinite) || bounds.width < 120 || bounds.height < 120)
        return null;
    if (!ROUTE_STYLES.includes(style))
        return null;
    if (!auditChainValues(placements, tilesById))
        return null;
    const opening = tilesById.get(placements[0].tileId);
    if (!opening)
        return null;
    const dirs = [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 0, y: -1 }];
    const base = Math.min(bounds.width, bounds.height);
    const turnOrder = { classic: [0, 1, 3, 2], loop: [1, 0, 3, 2], spiral: [3, 0, 1, 2] };
    const rotated = (d) => (d + (orientation === 'vertical' ? 1 : 0)) % 4;
    // Per-scale budget avoids exponential stalls on impossible arrangements.
    for (const factor of [0.7]) {
        const h = options.fixedScale ? Math.min(bounds.width / 24, bounds.height / 12) : base / 13 * factor, w = 2 * h;
        const first = { tileId: placements[0].tileId, center: { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 }, angle: opening.a === opening.b ? (orientation === 'horizontal' ? 90 : 0) : (orientation === 'horizontal' ? 0 : 90), width: w, height: h };
        if (!validatePhysicalChain([first], bounds))
            continue;
        const placed = [first];
        // Domains are propagated during DFS. A branch is pruned as soon as either
        // physical port cannot print the required pip, before exploring descendants.
        const domains = new Map([[first.tileId, opening.a === opening.b ? [false] : [false, true]]]);
        const pruneStats = { visited: 0, rejected: 0 };
        const ends = { left: first, right: first };
        const headings = { left: rotated(2), right: rotated(0) };
        let explored = 0;
        const budget = maxNodes;
        const search = (index) => {
            if (index === placements.length)
                return verifyPhysicalContacts(placements, placed) && verifyFacePorts(placements, placed) && orientPrintedPorts(placements, placed, tilesById) !== null;
            metrics.nodes++;
            metrics.elapsedMs = performance.now() - started;
            if (++explored > budget || metrics.nodes > maxNodes || metrics.elapsedMs > maxMillis) {
                metrics.exhausted = true;
                return false;
            }
            pruneStats.visited++;
            const p = placements[index], tile = tilesById.get(p.tileId);
            if (!tile)
                return false;
            const side = p.side, prev = ends[side], oldDir = headings[side];
            // Style-specific turn cadence. A failed candidate is backtracked safely;
            // a visual style is never allowed to override face-contact or collision rules.
            const branchDepth = placed.filter((_, i) => i > 0 && placements[i]?.side === side).length;
            const turnFirst = style === 'loop' ? (branchDepth % 5 === 3) : style === 'spiral' ? (branchDepth % 4 === 2) : branchDepth % 7 === 5;
            const preference = turnOrder[style].map(rotated);
            const preferred = turnFirst ? [...preference.filter(d => d !== oldDir), oldDir] : [oldDir, ...preference];
            let candidates = preferred.filter((d, i) => preferred.indexOf(d) === i);
            if(options.fixedScale){
                // Long horizontal runs with clockwise/counterclockwise U-turns.
                // At a descending segment, turn back across the next clear lane.
                if(oldDir%2===0)candidates=[oldDir,1,(oldDir+2)%4,3];
                else {
                    const branch=placed.filter((t,i)=>i===0||placements[i]?.side===side);
                    let lastHorizontal=side==='left'?2:0;
                    for(let j=branch.length-1;j>0;j--){const dx=branch[j].center.x-branch[j-1].center.x;if(Math.abs(dx)>h){lastHorizontal=dx>0?0:2;break}}
                    const across=(lastHorizontal+2)%4;
                    candidates=[across,1,lastHorizontal,3];
                }
            }
            for (const d of candidates) {
                const angle = (d % 2 === 0 ? 0 : 90) + (tile.a === tile.b ? 90 : 0);
                const baseNext = attachAtFace(prev, { tileId: p.tileId, angle, width: w, height: h }, dirs[d]);
                const n = dirs[d], tangent = { x: -n.y, y: n.x };
                // Turn on an actual numbered half of a long edge, never on its ambiguous seam.
                const previousSides = facePorts(prev).findIndex(port => Math.abs(port.normal.x - n.x) < 1e-6 && Math.abs(port.normal.y - n.y) < 1e-6);
                const nextSides = facePorts(baseNext).findIndex(port => Math.abs(port.normal.x + n.x) < 1e-6 && Math.abs(port.normal.y + n.y) < 1e-6);
                const offsets = (shape, port) => port < 2 ? [0] : [0, -shape.width / 4, shape.width / 4];
                for (const pa of offsets(prev, previousSides))
                    for (const pb of offsets(baseNext, nextSides)) {
                        if (metrics.exhausted)
                            return false;
                        metrics.attempts++;
                        const shift = pa - pb, next = { ...baseNext, center: { x: baseNext.center.x + tangent.x * shift, y: baseNext.center.y + tangent.y * shift } };
                        if (!faceContact(prev, next) || !validatePhysicalChain([...placed, next], { x: -1e8, y: -1e8, width: 2e8, height: 2e8 }))
                            continue;
                        if(options.fixedScale){
                            const extents=[...placed,next].map(t=>{const v=Math.abs(Math.sin(t.angle*Math.PI/180))>.5;return {l:t.center.x-(v?t.height:t.width)/2,r:t.center.x+(v?t.height:t.width)/2,t:t.center.y-(v?t.width:t.height)/2,b:t.center.y+(v?t.width:t.height)/2}});
                            if(Math.max(...extents.map(b=>b.r))-Math.min(...extents.map(b=>b.l))>bounds.width-4*h || Math.max(...extents.map(b=>b.b))-Math.min(...extents.map(b=>b.t))>bounds.height-4*h)continue;
                        }
                        // Non-neighbours must not acquire accidental extra edge connections.
                        if (placed.some(t => t.tileId !== prev.tileId && faceContact(t, next)))
                            continue;
                        const ports = touchingPorts(prev, next);
                        if (!ports)
                            continue;
                        const priorTile = tilesById.get(prev.tileId);
                        if (tile.a === tile.b && ports.b < 2 || priorTile.a === priorTile.b && ports.a < 2)
                            continue;
                        const priorDomain = domains.get(prev.tileId);
                        const nextDomain = (tile.a === tile.b ? [false] : [false, true]).filter(reverse => portValue(tile, next, ports.b, reverse, ports)?.value === p.joined);
                        const narrowedPrior = priorDomain.filter(reverse => portValue(priorTile, prev, ports.a, reverse, ports)?.value === p.joined);
                        if (!nextDomain.length || !narrowedPrior.length) {
                            pruneStats.rejected++;
                            continue;
                        }
                        domains.set(prev.tileId, narrowedPrior);
                        domains.set(next.tileId, nextDomain);
                        placed.push(next);
                        ends[side] = next;
                        headings[side] = d;
                        if (search(index + 1))
                            return true;
                        placed.pop();
                        ends[side] = prev;
                        headings[side] = oldDir;
                        domains.set(prev.tileId, priorDomain);
                        domains.delete(next.tileId);
                    }
            }
            return false;
        };
        if (search(1)) {
            metrics.elapsedMs = performance.now() - started;
            const endpoints = physicalEndpoints(ends, { left: dirs[headings.left], right: dirs[headings.right] });
            const boxes = placed.map(t => { const vertical = Math.abs(Math.sin(t.angle * Math.PI / 180)) > .5; return { x: t.center.x - (vertical ? t.height : t.width) / 2, y: t.center.y - (vertical ? t.width : t.height) / 2, w: vertical ? t.height : t.width, h: vertical ? t.width : t.height }; });
            const minX = Math.min(...boxes.map(b => b.x), endpoints.left.x - h, endpoints.right.x - h), minY = Math.min(...boxes.map(b => b.y), endpoints.left.y - h, endpoints.right.y - h);
            const maxX = Math.max(...boxes.map(b => b.x + b.w), endpoints.left.x + h, endpoints.right.x + h), maxY = Math.max(...boxes.map(b => b.y + b.h), endpoints.left.y + h, endpoints.right.y + h);
            const fit = options.fixedScale ? 1 : Math.min(1, (bounds.width - 8) / (maxX - minX), (bounds.height - 8) / (maxY - minY));
            const transform = (p) => ({ x: bounds.x + bounds.width / 2 + (p.x - (minX + maxX) / 2) * fit, y: bounds.y + bounds.height / 2 + (p.y - (minY + maxY) / 2) * fit });
            const fitted = placed.map(t => ({ ...t, center: transform(t.center), width: t.width * fit, height: t.height * fit }));
            if (!validatePhysicalChain(fitted, bounds) || !verifyFacePorts(placements, fitted) || !orientPrintedPorts(placements, fitted, tilesById))
                return null;
            return { tiles: fitted, endpoints: { left: transform(endpoints.left), right: transform(endpoints.right) }, style, scale: factor * fit };
        }
        if (metrics.exhausted)
            break;
    }
    metrics.elapsedMs = performance.now() - started;
    return null;
}
export function facePorts(tile) {
    const r = tile.angle * Math.PI / 180;
    const u = { x: Math.cos(r), y: Math.sin(r) }, v = { x: -Math.sin(r), y: Math.cos(r) };
    return [
        { center: { x: tile.center.x + u.x * tile.width / 2, y: tile.center.y + u.y * tile.width / 2 }, normal: u, length: tile.height },
        { center: { x: tile.center.x - u.x * tile.width / 2, y: tile.center.y - u.y * tile.width / 2 }, normal: { x: -u.x, y: -u.y }, length: tile.height },
        { center: { x: tile.center.x + v.x * tile.height / 2, y: tile.center.y + v.y * tile.height / 2 }, normal: v, length: tile.width },
        { center: { x: tile.center.x - v.x * tile.height / 2, y: tile.center.y - v.y * tile.height / 2 }, normal: { x: -v.x, y: -v.y }, length: tile.width },
    ];
}
export function faceContact(a, b, epsilon = 1e-5) {
    for (const pa of facePorts(a))
        for (const pb of facePorts(b)) {
            const opposition = pa.normal.x * pb.normal.x + pa.normal.y * pb.normal.y;
            if (opposition > -1 + epsilon)
                continue;
            const delta = { x: pb.center.x - pa.center.x, y: pb.center.y - pa.center.y };
            const normalGap = Math.abs(delta.x * pa.normal.x + delta.y * pa.normal.y);
            const tangentialGap = Math.abs(-delta.x * pa.normal.y + delta.y * pa.normal.x);
            if (normalGap <= epsilon && tangentialGap < (pa.length + pb.length) / 2 - epsilon)
                return true;
        }
    return false;
}
/** Strict port audit in play order, including both independent branches. */
export function verifyFacePorts(placements, tiles) {
    if (!placements.length || placements.length !== tiles.length)
        return false;
    const last = { left: 0, right: 0 };
    for (let i = 0; i < placements.length; i++) {
        if (placements[i].tileId !== tiles[i].tileId)
            return false;
        if (i === 0)
            continue;
        const side = placements[i].side;
        if (!faceContact(tiles[last[side]], tiles[i]))
            return false;
        last[side] = i;
    }
    return true;
}
/** Translation/rotation/scale-invariant visual trace, for comparing styles.
 * A trace is an audit aid, not proof of premium aesthetics. */
export function silhouetteSignature(layout) {
    const tiles = layout.tiles;
    if (!tiles.length)
        return '';
    const unit = Math.min(tiles[0].width, tiles[0].height);
    const start = tiles[0].center;
    return tiles.map(t => `${Math.round((t.center.x - start.x) / unit * 100) / 100},${Math.round((t.center.y - start.y) / unit * 100) / 100}`).join(';');
}
/** Fail-closed semantic physical layout. The legacy physical candidate is never
 * advertised as numerically verified unless every printed port is consistent. */
export function semanticPhysicalLayout(placements, bounds, orientation, style, tilesById) {
    const candidate = physicalLayout(placements, bounds, orientation, style, tilesById);
    return candidate && orientPrintedPorts(placements, candidate.tiles, tilesById) !== null ? candidate : null;
}
export function buildTableModel(placements, bounds, orientation, style, byId, options = {}) {
    const metrics = { nodes: 0, attempts: 0, elapsedMs: 0, exhausted: false };
    if (![bounds.x, bounds.y, bounds.width, bounds.height].every(Number.isFinite) || bounds.width < 120 || bounds.height < 120)
        return { status: 'unavailable', geometry: null, nodes: [], connections: [], failure: 'INVALID_BOUNDS', metrics };
    if (!placements.length) {
        const geometry = layoutTable([], bounds, orientation, style);
        return { status: 'empty', geometry: { ...geometry, links: [] }, nodes: [], connections: [], failure: null, metrics };
    }
    const solved = physicalLayout(placements, bounds, orientation, style, byId, { ...options, metrics });
    const reversed = solved ? orientPrintedPorts(placements, solved.tiles, byId) : null;
    if (!solved || !reversed)
        return { status: 'unavailable', geometry: null, nodes: [], connections: [], failure: metrics.exhausted ? 'SEARCH_LIMIT' : 'NO_VALID_LAYOUT', metrics };
    const connections = [], last = { left: 0, right: 0 }, used = new Map();
    for (let i = 1; i < placements.length; i++) {
        const p = placements[i], a = solved.tiles[last[p.side]], b = solved.tiles[i], ports = touchingPorts(a, b);
        connections.push({ fromId: a.tileId, toId: b.tileId, side: p.side, value: p.joined, fromPort: ports.a, toPort: ports.b, start: ports.start, end: ports.end });
        for (const [id, port] of [[a.tileId, ports.a], [b.tileId, ports.b]]) {
            const set = used.get(id) ?? new Set();
            set.add(port);
            used.set(id, set);
        }
        last[p.side] = i;
    }
    const openPorts = {}, endpoints = {};
    for (const side of ['left', 'right']) {
        const index = last[side], shape = solved.tiles[index], p = placements[index], tile = byId.get(shape.tileId);
        const exposed = index === 0 ? (side === 'left' ? p.joined : p.exposed) : p.exposed;
        const reference = solved.endpoints[side], ports = facePorts(shape);
        const available = ports.map((port, i) => ({ port, i })).filter(({ i }) => (tile.a !== tile.b || i >= 2) && !used.get(tile.id)?.has(i) && portValue(tile, shape, i, reversed.get(tile.id))?.value === exposed);
        available.sort((a, b) => dist(a.port.center, reference) - dist(b.port.center, reference));
        const candidate = available[0];
        if (!candidate)
            return { status: 'unavailable', geometry: null, nodes: [], connections: [], failure: 'NO_EXPOSED_FACE', metrics };
        openPorts[side] = candidate.port;
        used.set(tile.id, new Set([...(used.get(tile.id) ?? []), candidate.i]));
        endpoints[side] = { x: candidate.port.center.x + candidate.port.normal.x * shape.height, y: candidate.port.center.y + candidate.port.normal.y * shape.height };
    }
    const nodes = solved.tiles.map((shape, i) => { const tile = byId.get(shape.tileId), reverse = reversed.get(tile.id) ?? false; const connection = connections.find(c => c.toId === tile.id), out = connections.find(c => c.fromId === tile.id); return { tileId: tile.id, official: tile, shape, printed: [reverse ? tile.b : tile.a, reverse ? tile.a : tile.b], side: placements[i].side, order: i, incoming: connection ? facePorts(shape)[connection.toPort] : null, outgoing: out ? facePorts(shape)[out.fromPort] : (last.left === i ? openPorts.left : last.right === i ? openPorts.right : null) ?? null }; });
    const first = solved.tiles[0];
    return { status: 'verified', geometry: { bounds, orientation, style, tileWidth: first.width, tileHeight: first.height, tiles: solved.tiles, endpoints, links: [] }, nodes, connections, failure: null, metrics };
}
