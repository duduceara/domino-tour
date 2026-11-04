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
    if (!best)
        throw new RuleError('No double available to open');
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
    return { placements: [], players, sleeping, chain: [], left: null, right: null, turn: opening.seat, lastPlayed: null, passesInRow: 0, target, dealSize, phase: 'playing', winner: null, events: [], openingRequiredTileId: opening.tile.id, roundsCompleted: 0 };
}
/** No drawing from sleeping tiles. A play is a tile ID and an explicit endpoint. */
export function play(s, seat, tileId, side) {
    checkTurn(s, seat);
    const p = player(s, seat);
    const index = p.hand.findIndex(t => t.id === tileId);
    if (index < 0)
        throw new RuleError('Tile not in hand');
    const tile = p.hand[index];
    if (s.openingRequiredTileId !== null && tileId !== s.openingRequiredTileId)
        throw new RuleError('Opening must use highest held double');
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
    s.events.push({ type: 'play', seat });
    if (p.hand.length === 0) {
        s.roundsCompleted++;
        s.events.push({ type: 'round-finished', seat });
        for (const other of s.players) {
            if (other.seat !== seat)
                scoreTransfer(s, other.seat, seat, 5);
        }
        finishIfWon(s, seat);
        if (s.phase !== 'finished') {
            s.phase = 'round-complete';
            s.nextOpeningSeat = seat;
        }
        return;
    }
    s.turn = next(seat);
}
export function pass(s, seat) {
    checkTurn(s, seat);
    if (legalTiles(s, seat).length)
        throw new RuleError('Cannot pass with playable tile');
    if (s.lastPlayed === null)
        throw new RuleError('No opening tile yet');
    scoreTransfer(s, seat, s.lastPlayed, 5);
    s.events.push({ type: 'pass', seat, delta: -5, beneficiary: s.lastPlayed });
    finishIfWon(s, s.lastPlayed);
    if (s.phase === 'finished')
        return;
    s.passesInRow++;
    if (s.passesInRow >= 3) {
        // Three passes return the turn to the last player. That player may still play.
        // Only an actual four-seat impasse suspends the round for adjudication.
        if (legalTiles(s, s.lastPlayed).length === 0) {
            s.events.push({ type: 'round-blocked', seat });
            s.phase = 'blocked-awaiting-rule';
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
    s.nextOpeningSeat = null;
    assertStateIntegrity(s);
}
/** Ends a completed round; a blocked round is held for a future adjudication rule. */
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
        lastPlayed: s.lastPlayed, target: s.target, phase: s.phase, winner: s.winner, openingRequiredTileId: s.openingRequiredTileId
    };
}
/** Audits score conservation; transfers and batidas must never mint competitive points. */
export function totalScore(s) { return s.players.reduce((sum, p) => sum + p.score, 0); }
/** A recharge is an explicitly authorized exception to score conservation. */
export function assertTileIntegrity(s) {
    const ids = [...s.players.flatMap(p => p.hand), ...s.sleeping, ...s.chain].map(t => t.id);
    if (ids.length !== 28 || new Set(ids).size !== 28 || ids.some(id => !Number.isInteger(id) || id < 0 || id >= 28))
        throw new RuleError('Tile conservation violated');
}
/** Resolving a blocked round needs an approved scoring/tie-break rule. No implicit winner. */
export function isBlocked(s) { return s.phase === 'blocked-awaiting-rule'; }
export function decideBot(view) {
    if (view.phase !== 'playing')
        throw new RuleError('Bot cannot act outside active round');
    const seat = view.turn;
    if (view.players[seat]?.kind !== 'bot')
        throw new RuleError('Current seat is not a bot');
    const options = [];
    for (const tile of view.ownHand) {
        if (view.left === null) {
            if (view.openingRequiredTileId === null || tile.id === view.openingRequiredTileId)
                options.push({ tileId: tile.id, side: 'right', weight: tile.a + tile.b });
            continue;
        }
        if (tile.a === view.left || tile.b === view.left)
            options.push({ tileId: tile.id, side: 'left', weight: tile.a + tile.b });
        if (tile.a === view.right || tile.b === view.right)
            options.push({ tileId: tile.id, side: 'right', weight: tile.a + tile.b });
    }
    if (!options.length)
        return { type: 'pass' };
    // Simple baseline heuristic: shed high-pip tiles, stable tie-breaks.
    options.sort((a, b) => b.weight - a.weight || a.tileId - b.tileId || a.side.localeCompare(b.side));
    const best = options[0];
    return { type: 'play', tileId: best.tileId, side: best.side };
}
/** Validated bot turn; the engine, not the heuristic, enforces every rule. */
export function runBotTurn(s) {
    checkTurn(s, s.turn);
    if (s.players[s.turn].kind !== 'bot')
        throw new RuleError('Current seat is not a bot');
    const decision = decideBot(viewFor(s, s.turn));
    if (decision.type === 'pass')
        pass(s, s.turn);
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
export function auditedBotTurn(s) {
    assertStateIntegrity(s);
    const decision = runBotTurn(s);
    assertStateIntegrity(s);
    return decision;
}
