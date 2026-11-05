import {chooseBotMove, validateDifficulty} from './bots.js';
export class RuleError extends Error {
    constructor(message) { super(message); this.name = 'RuleError'; }
}
const assert = (condition, message) => { if (!condition)
    throw new RuleError(message); };
export const allTiles = () => { const tiles = []; let id = 0; for (let a = 0; a <= 6; a++)
    for (let b = a; b <= 6; b++)
        tiles.push({ id: id++, a: a, b: b }); return tiles; };
/** Uniform random index using rejection sampling; cryptographic RNG, not Math.random. */
export function secureIndex(upperExclusive) {
    if (!Number.isSafeInteger(upperExclusive) || upperExclusive < 1 || upperExclusive > 0x100000000)
        throw new RuleError('Invalid random range');
    const range = 0x100000000, limit = Math.floor(range / upperExclusive) * upperExclusive;
    const buf = new Uint32Array(1);
    let n;
    do {
        crypto.getRandomValues(buf);
        n = buf[0];
    } while (n >= limit);
    return n % upperExclusive;
}
export function shuffled(values, randomIndex = secureIndex) { const copy = [...values]; for (let i = copy.length - 1; i > 0; i--) {
    const j = randomIndex(i + 1);
    if (!Number.isInteger(j) || j < 0 || j > i)
        throw new RuleError('Invalid RNG index');
    [copy[i], copy[j]] = [copy[j], copy[i]];
} return copy; }
/** First deal of a fresh match: highest double held by any participant opens. */
export function highestHeldDouble(players) {
    let best = null;
    for (const p of players)
        for (const tile of p.hand) {
            if (tile.a === tile.b && (!best || tile.a > best.tile.a))
                best = { seat: p.seat, tile };
        }
    if (!best) {
        // Highest sum, then highest end, then lowest seat: deterministic fallback.
        for (const p of players) for (const tile of p.hand) {
            const rank = t => (t.a + t.b) * 10 + Math.max(t.a, t.b);
            if (!best || rank(tile) > rank(best.tile) || (rank(tile) === rank(best.tile) && p.seat < best.seat)) best = { seat: p.seat, tile };
        }
    }
    if (!best) throw new RuleError('No opening tile');
    return best;
}
const next = (seat) => ((seat + 1) % 4);
const player = (s, seat) => s.players[seat];
const checkTurn = (s, seat) => { if (s.phase !== 'playing')
    throw new RuleError('Game not active'); if (s.turn !== seat)
    throw new RuleError('Not your turn'); };
const compatible = (s, t) => s.left === null || t.a === s.left || t.b === s.left || t.a === s.right || t.b === s.right;
export const legalTiles = (s, seat) => player(s, seat).hand.filter(t => compatible(s, t));
const scoreTransfer = (s, from, to, amount) => { if (from === to)
    throw new RuleError('Cannot transfer to self'); player(s, from).score -= amount; player(s, to).score += amount; };
const finishIfWon = (s, seat) => { if (player(s, seat).score >= s.target * 2) {
    s.phase = 'finished';
    s.winner = seat;
    s.events.push({ type: 'finish', seat });
} };
/** A round is initialized with starting balance = target. Winning requires target NET additional points. */
export function newGame(target, dealSize, randomIndex = secureIndex) {
    if (![100, 150, 200].includes(target) || ![6, 7].includes(dealSize))
        throw new RuleError('Invalid setup');
    const tiles = shuffled(allTiles(), randomIndex);
    const players = [0, 1, 2, 3].map(seat => ({ seat, kind: seat === 0 ? 'human' : 'bot', hand: tiles.slice(seat * dealSize, (seat + 1) * dealSize), score: target, connected: true }));
    const sleeping = tiles.slice(dealSize * 4);
    const opening = highestHeldDouble(players);
    const state = { placements: [], players, sleeping, chain: [], left: null, right: null, turn: opening.seat, lastPlayed: null, passesInRow: 0, target, dealSize, phase: 'playing', winner: null, events: [], openingRequiredTileId: null, roundsCompleted: 0, passedSeats: [], roundAwards: [] };
    declareFiveAtDeal(state);
    return state;
}
/** No drawing from sleeping tiles. A play is a tile ID and an explicit endpoint. */
export function play(s, seat, tileId, side) {
    checkTurn(s, seat);
    if (!['left', 'right'].includes(side)) throw new RuleError('Invalid endpoint');
    const p = player(s, seat);
    const index = p.hand.findIndex(t => t.id === tileId);
    if (index < 0)
        throw new RuleError('Tile not in hand');
    const tile = p.hand[index];
    let left = s.left, right = s.right;
    if (left === null) {
        left = tile.a;
        right = tile.b;
    }
    else if (side === 'left') {
        if (tile.a === left)
            left = tile.b;
        else if (tile.b === left)
            left = tile.a;
        else
            throw new RuleError('Illegal left endpoint');
    }
    else {
        if (tile.a === right)
            right = tile.b;
        else if (tile.b === right)
            right = tile.a;
        else
            throw new RuleError('Illegal right endpoint');
    }
    const bothEnds = s.left !== null && s.left !== s.right && tile.a !== tile.b && compatibleEnds(s, tile);
    const joined = s.left === null ? tile.a : (side === 'left' ? s.left : s.right);
    const exposed = s.left === null ? tile.b : (side === 'left' ? left : right);
    s.placements.push({ tileId, side, joined, exposed });
    p.hand.splice(index, 1);
    s.left = left;
    s.right = right;
    s.chain.push(tile);
    s.lastPlayed = seat;
    s.openingRequiredTileId = null;
    s.passesInRow = 0;
    s.events.push({ type: 'play', seat, tileId, side });
    if (p.hand.length === 0) {
        const category = bothEnds ? 'la-e-lo' : tile.a === tile.b ? 'double' : !(s.passedSeats ?? []).includes(seat) ? 'without-pass' : 'simple';
        completeRound(s, seat, category, { 'la-e-lo': 40, double: 30, 'without-pass': 20, simple: 10 }[category]);
        return;
    }
    s.turn = next(seat);
}
export function pass(s, seat, randomIndex = secureIndex) {
    checkTurn(s, seat);
    if (legalTiles(s, seat).length)
        throw new RuleError('Cannot pass with playable tile');
    if (s.lastPlayed === null)
        throw new RuleError('No opening tile yet');
    s.passedSeats ??= [];
    if (!s.passedSeats.includes(seat)) s.passedSeats.push(seat);
    scoreTransfer(s, seat, s.lastPlayed, 5);
    s.events.push({ type: 'pass', seat, delta: -5, beneficiary: s.lastPlayed, left: s.left, right: s.right });
    finishIfWon(s, s.lastPlayed);
    if (s.phase === 'finished')
        return;
    s.passesInRow++;
    if (s.passesInRow >= 3) {
        // Three passes return the turn to the last player. That player may still play.
        // Only an actual four-seat impasse resolves the round.
        if (legalTiles(s, s.lastPlayed).length === 0) {
            s.events.push({ type: 'round-blocked', seat });
            resolveBlockedRound(s, randomIndex);
            return;
        }
        s.passesInRow = 0;
    }
    s.turn = next(seat);
}
/** Explicit user confirmation to begin the next offline round. No implicit redeal. */
export function continueRound(s, randomIndex = secureIndex) {
    if (s.phase !== 'round-complete' || !Number.isInteger(s.nextOpeningSeat))
        throw new RuleError('No completed round awaiting confirmation');
    const seat = s.nextOpeningSeat;
    s.phase = 'playing';
    startNextRound(s, seat, randomIndex);
    assertStateIntegrity(s);
}
/** Deal the next round for its previous winner; reset only round-local state. */
export function startNextRound(s, openingSeat, randomIndex = secureIndex) {
    if (s.phase !== 'playing')
        throw new RuleError('Cannot redeal an unresolved or finished match');
    const tiles = shuffled(allTiles(), randomIndex);
    for (const p of s.players)
        p.hand = tiles.slice(p.seat * s.dealSize, (p.seat + 1) * s.dealSize);
    s.sleeping = tiles.slice(s.dealSize * 4);
    s.chain = [];
    s.placements = [];
    s.left = null;
    s.right = null;
    s.turn = openingSeat;
    s.lastPlayed = null;
    s.passesInRow = 0;
    s.phase = 'playing';
    s.openingRequiredTileId = null;
    s.nextOpeningSeat = null;
    s.passedSeats = [];
    s.roundHistoryStart = s.events.length;
    declareFiveAtDeal(s);
}
/** Score-only recharge. Wallet authorization must be handled by an external economy service. */
export function recharge(s, seat, authorized) {
    if (s.phase === 'finished')
        throw new RuleError('Match finished');
    if (!authorized)
        throw new RuleError('Recharge not authorized');
    const p = player(s, seat);
    if (p.score > 0)
        throw new RuleError('Player not depleted');
    p.score += s.target;
    s.events.push({ type: 'recharge', seat, delta: s.target });
}
export function botTakeover(s, seat) { if (s.phase === 'finished')
    throw new RuleError('Match finished'); const p = player(s, seat); p.kind = 'bot'; p.connected = false; s.events.push({ type: 'bot-takeover', seat }); }
export function viewFor(s, seat) {
    if (!Number.isInteger(seat) || seat < 0 || seat > 3)
        throw new RuleError('Invalid seat');
    return {
        players: s.players.map(p => ({ seat: p.seat, kind: p.kind, score: p.score, connected: p.connected, handCount: p.hand.length })),
        ownHand: s.players[seat].hand.map(t => ({ ...t })), sleepingCount: s.sleeping.length,
        chain: s.chain.map(t => ({ ...t })), placements: s.placements.map(p => ({ ...p })), left: s.left, right: s.right, turn: s.turn,
        lastPlayed: s.lastPlayed, target: s.target, phase: s.phase, winner: s.winner, openingRequiredTileId: s.openingRequiredTileId,
        history: s.events.slice(s.roundHistoryStart ?? 0).filter(e => ['play', 'pass'].includes(e.type)).map(e => ({...e}))
    };
}
/** Passes conserve scores; round awards add the approved fixed points. */
export function totalScore(s) { return s.players.reduce((sum, p) => sum + p.score, 0); }
/** A recharge is an explicitly authorized exception to score conservation. */
export function assertTileIntegrity(s) {
    const ids = [...s.players.flatMap(p => p.hand), ...s.sleeping, ...s.chain].map(t => t.id);
    if (ids.length !== 28 || new Set(ids).size !== 28 || ids.some(id => !Number.isInteger(id) || id < 0 || id >= 28))
        throw new RuleError('Tile conservation violated');
}
/** Legacy unresolved-state predicate retained for compatibility. */
export function isBlocked(s) { return s.phase === 'blocked-awaiting-rule'; }
export function decideBot(view, difficulty = 'easy') {
    if (view.phase !== 'playing') throw new RuleError('Bot cannot act outside active round');
    if (view.players[view.turn]?.kind !== 'bot') throw new RuleError('Current seat is not a bot');
    return chooseBotMove(view, difficulty);
}
/** Validated bot turn; the engine, not the heuristic, enforces every rule. */
export function runBotTurn(s, randomIndex = secureIndex, difficulty = 'easy') {
    checkTurn(s, s.turn);
    if (s.players[s.turn].kind !== 'bot')
        throw new RuleError('Current seat is not a bot');
    validateDifficulty(difficulty);
    const decision = decideBot(viewFor(s, s.turn), difficulty);
    if (decision.type === 'pass')
        pass(s, s.turn, randomIndex);
    else
        play(s, s.turn, decision.tileId, decision.side);
    return decision;
}
/** Read-only audit for trusted engine state. The UI never receives hidden hands. */
export function assertStateIntegrity(s) {
    assertTileIntegrity(s);
    if (s.openingRequiredTileId !== null && (s.chain.length !== 0 || s.players[s.turn].hand.every(t => t.id !== s.openingRequiredTileId)))
        throw new RuleError('Invalid opening state');
    if (s.placements.length !== s.chain.length || s.placements.some((p, i) => p.tileId !== s.chain[i]?.id))
        throw new RuleError('Placement history inconsistent');
    if (![100, 150, 200].includes(s.target) || ![6, 7].includes(s.dealSize))
        throw new RuleError('Invalid match configuration');
    if (s.players.some((p, i) => p.seat !== i || !Number.isSafeInteger(p.score)))
        throw new RuleError('Invalid player state');
    if (!Number.isInteger(s.turn) || s.turn < 0 || s.turn > 3)
        throw new RuleError('Invalid turn');
    if (s.winner !== null && (s.phase !== 'finished' || s.players[s.winner].score < s.target * 2))
        throw new RuleError('Invalid winner');
    if (s.phase === 'finished' && s.winner === null)
        throw new RuleError('Missing winner');
    if ((s.left === null) !== (s.right === null))
        throw new RuleError('Incomplete endpoints');
    if (s.chain.length === 0 && (s.left !== null || s.lastPlayed !== null))
        throw new RuleError('Invalid empty table');
    if (s.chain.length > 0 && (s.left === null || s.lastPlayed === null))
        throw new RuleError('Missing table state');
}
/** One deterministic AI action, with safety assertions before and after. */
export function auditedBotTurn(s, randomIndex = secureIndex, difficulty = 'easy') {
    assertStateIntegrity(s);
    const decision = runBotTurn(s, randomIndex, difficulty);
    assertStateIntegrity(s);
    return decision;
}

const compatibleEnds = (s, t) => (t.a === s.left || t.b === s.left) && (t.a === s.right || t.b === s.right);
const doubles = p => p.hand.filter(t => t.a === t.b).length;
function completeRound(s, seat, category, points) {
    if (s.phase !== 'playing') throw new RuleError('Round already resolved');
    player(s, seat).score += points;
    s.roundAwards ??= [];
    s.roundAwards.push({ seat, category, points });
    s.roundsCompleted++;
    s.nextOpeningSeat = seat;
    s.events.push({ type: 'round-finished', seat, category, points });
    s.phase = 'round-complete';
    finishIfWon(s, seat);
    if (s.phase === 'finished') delete s.nextOpeningSeat;
}
/** Mandatory declaration is recorded automatically before any move after a deal. */
export function declareFiveAtDeal(s) {
    if (s.phase !== 'playing' || s.chain.length) return false;
    const p = s.players.find(p => doubles(p) >= 5);
    if (!p) return false;
    s.events.push({ type: 'declare-five', seat: p.seat });
    completeRound(s, p.seat, 'five-doubles', 10);
    return true;
}
/** All four hands must actually be blocked; injectable unbiased index for tie tests. */
export function resolveBlockedRound(s, randomIndex = secureIndex) {
    if (s.phase !== 'playing' || s.left === null || s.players.some(p => legalTiles(s, p.seat).length)) throw new RuleError('Round is not blocked');
    const sums = s.players.map(p => p.hand.reduce((sum, t) => sum + t.a + t.b, 0));
    const candidates = s.players.filter(p => sums[p.seat] === Math.min(...sums)).map(p => p.seat);
    const index = candidates.length === 1 ? 0 : randomIndex(candidates.length);
    if (!Number.isInteger(index) || index < 0 || index >= candidates.length) throw new RuleError('Invalid tie RNG');
    const seat = candidates[index];
    s.events.push({ type: 'blocked-result', seat, sums, candidates });
    completeRound(s, seat, 'blocked', 10);
}

/** Explicit, non-mutating migration for legacy JSON snapshots; never replays turns. */
export function migrateGameState(snapshot) {
    const state = structuredClone(snapshot);
    assertStateIntegrity(state);
    if (!Array.isArray(state.events)) throw new RuleError('Invalid event history');
    const retained = event => event.type !== 'declare-four';
    if (state.roundHistoryStart !== undefined) {
        const start = state.roundHistoryStart;
        if (!Number.isInteger(start) || start < 0 || start > state.events.length) throw new RuleError('Invalid round history boundary');
        state.roundHistoryStart = state.events.slice(0, start).filter(retained).length;
    }
    state.events = state.events.filter(retained);
    delete state.declaredFour;
    delete state.playedSeats; // Used exclusively by the retired four-double rule.
    return state;
}
