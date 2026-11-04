const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export class TouchController {
    layout;
    selected = null;
    active = null;
    constructor(layout) {
        this.layout = layout;
        if (!Number.isFinite(layout.autoCommitDistance) || layout.autoCommitDistance <= 0 || !Number.isFinite(layout.dragThreshold) || layout.dragThreshold <= 0)
            throw new Error('Invalid touch layout');
    }
    get selectedTile() { return this.selected; }
    /** A single tap selects. Tapping the selected tile again does not play it. */
    tap(hit) {
        if (hit.kind === 'tile') {
            this.selected = hit.tileId;
            return { type: 'select', tileId: hit.tileId };
        }
        if (hit.kind === 'endpoint' && this.selected !== null)
            return { type: 'play', tileId: this.selected, side: hit.side };
        return null;
    }
    begin(pointerId, tileId, at) {
        if (this.active !== null || !Number.isInteger(pointerId))
            return;
        this.active = { pointerId, tileId, origin: at, dragging: false };
    }
    move(pointerId, at) {
        const a = this.active;
        if (!a || a.pointerId !== pointerId)
            return null;
        if (distance(a.origin, at) >= this.layout.dragThreshold)
            a.dragging = true;
        if (!a.dragging || distance(a.origin, at) < this.layout.autoCommitDistance)
            return null;
        const side = this.layout.orientation === 'horizontal' ? (at.x < this.layout.center.x ? 'left' : 'right') : (at.y < this.layout.center.y ? 'left' : 'right');
        this.active = null;
        this.selected = a.tileId;
        return { type: 'play', tileId: a.tileId, side };
    }
    end(pointerId) {
        const a = this.active;
        if (!a || a.pointerId !== pointerId)
            return null;
        this.active = null;
        if (!a.dragging) {
            this.selected = a.tileId;
            return { type: 'select', tileId: a.tileId };
        }
        return { type: 'cancel' };
    }
    cancel() { this.active = null; this.selected = null; }
    /** Call after successful engine commit; rejected moves remain selected for correction. */
    committed() { this.selected = null; }
}
