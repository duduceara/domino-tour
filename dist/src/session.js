import {reconcileHandLayout, previewHandMove, restoreHandLayout} from './hand.js';
import {validateDifficulty} from './bots.js';
import { newGame, runBotTurn, play, pass, legalTiles, continueRound, assertStateIntegrity } from './engine.js';
import { TableInteraction, buildTableModel, validSides } from './table.js';
export class LocalSession {
    state;
    interaction;
    model;
    difficulty = 'easy';
    orientation = 'horizontal';
    routeStyle = 'classic';
    bounds = { x: 0, y: 0, width: 800, height: 430 };
    previews = new Map();
    handLayout = null;
    constructor(target = 100, dealSize = 6, difficulty = 'easy') { this.difficulty = validateDifficulty(difficulty); this.state = newGame(target, dealSize); this.model = this.solve(); this.interaction = this.makeInteraction(); }
    solve() { return buildTableModel(this.state.placements, this.bounds, this.orientation, this.routeStyle, new Map(this.state.chain.map(t => [t.id, t]))); }
    geometry() { const center = { x: this.bounds.x + this.bounds.width / 2, y: this.bounds.y + this.bounds.height / 2 }; return this.model.geometry ?? { bounds: this.bounds, orientation: this.orientation, style: this.routeStyle, tileWidth: 0, tileHeight: 0, tiles: [], links: [], endpoints: { left: center, right: center } }; }
    makeInteraction() { return new TableInteraction(this.state, 0, this.geometry(), (id, side) => this.preview(id, side), (id, side) => this.humanPlay(id, side)); }
    preview(tileId, side) {
        if (this.model.status === 'unavailable' || !validSides(this.state, 0, tileId).includes(side))
            return null;
        const key = `${tileId}:${side}`;
        if (this.previews.has(key))
            return this.previews.get(key);
        const tile = this.state.players[0].hand.find(t => t.id === tileId);
        const joined = this.state.left === null ? tile.a : (side === 'left' ? this.state.left : this.state.right);
        const exposed = this.state.left === null ? tile.b : (tile.a === joined ? tile.b : tile.a);
        const placement = { tileId, side, joined, exposed };
        const model = buildTableModel([...this.state.placements, placement], this.bounds, this.orientation, this.routeStyle, new Map([...this.state.chain, tile].map(t => [t.id, t])));
        const node = model.nodes.at(-1);
        const result = model.status === 'verified' && node ? { tileId, side, center: node.shape.center, valid: true, model, shape: node.shape, printed: node.printed } : null;
        this.previews.set(key, result);
        return result;
    }
    refresh() { this.previews.clear(); this.model = this.solve(); this.interaction.updateGeometry(this.geometry()); }
    resize(bounds, orientation) {
        if (JSON.stringify(bounds) === JSON.stringify(this.bounds) && orientation === this.orientation)
            return;
        this.bounds = bounds;
        this.orientation = orientation;
        this.refresh();
    }
    setRouteStyle(style) { if (style === this.routeStyle)
        return; this.routeStyle = style; this.refresh(); }
    advanceBots(maxTurns = 100) { let n = 0; while (this.state.phase === 'playing' && this.state.turn !== 0 && n < maxTurns) {
        runBotTurn(this.state, undefined, this.difficulty);
        n++;
        assertStateIntegrity(this.state);
    } this.refresh(); return n; }
    humanPlay(tileId, side) {
        if (this.state.turn !== 0 || this.state.phase !== 'playing' || !this.preview(tileId, side))
            return false;
        try {
            play(this.state, 0, tileId, side);
            assertStateIntegrity(this.state);
            this.refresh();
            return true;
        }
        catch {
            return false;
        }
    }
    humanPass() { if (this.state.turn !== 0 || legalTiles(this.state, 0).length || this.state.phase !== 'playing')
        return false; pass(this.state, 0); this.refresh(); return true; }
    setDifficulty(level) { this.difficulty = validateDifficulty(level); }
    orderedHand() {
        this.handLayout = reconcileHandLayout(this.handLayout, this.state.players[0].hand);
        const tiles = new Map(this.state.players[0].hand.map(t => [t.id, t]));
        return this.handLayout.order.map(id => tiles.get(id));
    }
    previewHandMove(tileId, beforeId, neighborId) {
        this.orderedHand();
        return previewHandMove(this.handLayout, this.state.players[0].hand, tileId, beforeId, neighborId);
    }
    moveHandTile(tileId, beforeId = null, neighborId = null) {
        if (this.state.phase !== 'playing') return false;
        const result = this.previewHandMove(tileId, beforeId, neighborId);
        if (!result) return false;
        this.interaction.cancel();
        this.handLayout = result;
        return true;
    }
    flipHandTile(tileId) {
        if (this.state.phase !== 'playing' || !this.orderedHand().some(t => t.id === tileId)) return false;
        this.handLayout.flipped[tileId] = !this.handLayout.flipped[tileId];
        return true;
    }
    snapshotHandLayout() {
        this.orderedHand();
        return {...structuredClone(this.handLayout), round: this.state.roundsCompleted};
    }
    restoreHandLayout(snapshot) {
        const layout = restoreHandLayout(snapshot, this.state.players[0].hand, this.state.roundsCompleted);
        this.interaction.cancel();
        this.handLayout = layout;
    }
    nextRound() {
        if (this.state.phase !== 'round-complete')
            return false;
        continueRound(this.state);
        this.handLayout = null;
        this.refresh();
        return true;
    }
    newMatch(target = this.state.target, dealSize = this.state.dealSize) { this.handLayout = null; this.state = newGame(target, dealSize); this.model = this.solve(); this.previews.clear(); this.interaction = this.makeInteraction(); }
}
