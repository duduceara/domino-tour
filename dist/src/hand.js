// Visual-only arrangement. Official tile values and engine hand order never change.
export function reconcileHandLayout(layout, hand) {
    const ids = hand.map(t => t.id), known = new Set(ids);
    const order = [...new Set((layout?.order ?? []).filter(id => known.has(id)))];
    order.push(...ids.filter(id => !order.includes(id)));
    return {version: 1, order, flipped: Object.fromEntries(order.map(id => [id, layout?.flipped?.[id] === true]))};
}
export const handFaces = (tile, flipped = false) => flipped ? [tile.b, tile.a] : [tile.a, tile.b];
export function previewHandMove(layout, hand, tileId, beforeId = null, neighborId = null) {
    const current = reconcileHandLayout(layout, hand), tile = hand.find(t => t.id === tileId);
    if (!tile || beforeId === tileId || (beforeId !== null && !current.order.includes(beforeId))) return null;
    const order = current.order.filter(id => id !== tileId);
    const index = beforeId === null ? order.length : order.indexOf(beforeId);
    order.splice(index, 0, tileId);
    const neighbor = hand.find(t => t.id === neighborId && t.id !== tileId);
    let flipped = current.flipped[tileId];
    if (neighbor) {
        const target = handFaces(neighbor, current.flipped[neighbor.id]);
        const score = rotation => handFaces(tile, rotation).reduce((n, value, row) => n + Number(value === target[row]), 0);
        // Prefer the existing orientation whenever it already aligns a shared value.
        if (score(flipped) === 0 && score(!flipped) > 0) flipped = !flipped;
    }
    return {version: 1, order, flipped: {...current.flipped, [tileId]: flipped}};
}
export function restoreHandLayout(snapshot, hand, round) {
    const ids = hand.map(t => t.id);
    if (!snapshot || snapshot.version !== 1 || snapshot.round !== round || !Array.isArray(snapshot.order) || snapshot.order.length !== ids.length || new Set(snapshot.order).size !== ids.length || snapshot.order.some(id => !ids.includes(id)) || !snapshot.flipped || typeof snapshot.flipped !== 'object' || Object.values(snapshot.flipped).some(v => typeof v !== 'boolean')) throw new Error('Hand layout does not match this round and hand');
    return reconcileHandLayout(snapshot, hand);
}
