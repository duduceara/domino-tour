// Pure strategy module: receives only viewFor's own hand and public table/history.
export const BOT_LEVELS = Object.freeze(['easy', 'medium', 'hard']);
export function validateDifficulty(level) {
    // Compatibility for previously stored settings; not a fourth difficulty.
    if (level === 'expert') level = 'hard';
    if (!BOT_LEVELS.includes(level)) throw new Error('Invalid bot difficulty');
    return level;
}
const fits = (t, end) => t.a === end || t.b === end;
const endsAfter = (v, t, side) => v.left === null ? [t.a, t.b] : side === 'left' ? [t.a === v.left ? t.b : t.a, v.right] : [v.left, t.a === v.right ? t.b : t.a];
function optionsFor(v) {
    const options = [];
    for (const tile of v.ownHand) {
        if (v.left === null) options.push({ tile, side: 'right' });
        else {
            if (fits(tile, v.left)) options.push({ tile, side: 'left' });
            if (fits(tile, v.right)) options.push({ tile, side: 'right' });
        }
    }
    return options;
}
function mediumScore(v, option) {
    const {tile, side} = option, ends = endsAfter(v, tile, side);
    const rest = v.ownHand.filter(t => t.id !== tile.id);
    const mobility = rest.filter(t => ends.some(e => fits(t, e))).length;
    const connections = rest.reduce((n, t) => n + Number(fits(t, tile.a)) + Number(tile.b !== tile.a && fits(t, tile.b)), 0);
    return tile.a + tile.b + 4 * mobility - 1.5 * connections + (tile.a === tile.b ? 2 : 0);
}
function publicAbsences(v) {
    const absent = new Map();
    for (const e of v.history ?? []) {
        if (e.type === 'pass') {
            const set = absent.get(e.seat) ?? new Set();
            if (Number.isInteger(e.left)) set.add(e.left);
            if (Number.isInteger(e.right)) set.add(e.right);
            absent.set(e.seat, set);
        }
    }
    return absent;
}
function hardScore(v, option, absent) {
    const ends = endsAfter(v, option.tile, option.side);
    let score = mediumScore(v, option);
    for (const p of v.players) {
        if (p.seat === v.turn) continue;
        const known = absent.get(p.seat);
        const blocked = known && ends.every(e => known.has(e));
        if (blocked) score += p.seat === (v.turn + 1) % 4 ? 12 : 5;
        if (p.handCount === 1 && blocked) score += 12;
    }
    return score;
}
// Local reproducible PRNG seeded only by public data and own hand; never global state.
function publicRandom(v) {
    let seed = 2166136261;
    for (const ch of JSON.stringify([v.turn, v.left, v.right, v.ownHand.map(t => t.id), v.chain.map(t => t.id), v.history])) seed = Math.imul(seed ^ ch.charCodeAt(0), 16777619) >>> 0;
    return n => {seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed % n;};
}
function sampledHands(v, absent) {
    const seen = new Set([...v.ownHand, ...v.chain].map(t => t.id));
    const pool = [];let id = 0;
    for (let a = 0; a <= 6; a++) for (let b = a; b <= 6; b++, id++) if (!seen.has(id)) pool.push({id, a, b});
    const random = publicRandom(v), samples = [];
    // At most 48 attempts. Reject public-history-inconsistent samples, never peek.
    for (let attempt = 0; attempt < 48; attempt++) {
        const shuffled = [...pool];
        for (let i = shuffled.length - 1; i > 0; i--) {const j = random(i + 1);[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];}
        const hands = new Map();let offset = 0, consistent = true;
        for (const p of v.players) {
            if (p.seat === v.turn) continue;
            const hand = shuffled.slice(offset, offset + p.handCount);offset += p.handCount;
            if (hand.some(t => absent.get(p.seat)?.has(t.a) || absent.get(p.seat)?.has(t.b))) consistent = false;
            hands.set(p.seat, hand);
        }
        if (consistent) samples.push(hands);
    }
    return samples;
}
export function chooseBotMove(view, difficulty = 'easy') {
    difficulty = validateDifficulty(difficulty);
    const options = optionsFor(view);
    if (!options.length) return {type: 'pass'};
    const absent = difficulty === 'hard' ? publicAbsences(view) : new Map();
    const samples = difficulty === 'hard' ? sampledHands(view, absent) : [];
    const ranked = options.map(option => {
        let score = difficulty === 'easy' ? option.tile.a + option.tile.b : difficulty === 'medium' ? mediumScore(view, option) : hardScore(view, option, absent);
        if (difficulty === 'hard' && samples.length) {
            const ends = endsAfter(view, option.tile, option.side), next = (view.turn + 1) % 4;
            let evaluation = 0;
            for (const hands of samples) {
                const replies = (hands.get(next) ?? []).filter(t => ends.some(e => fits(t, e)));
                evaluation += replies.length === 0 ? 14 : -replies.length * 1.5;
                if (view.players[next].handCount === 1 && replies.length) evaluation -= 35;
            }
            score += evaluation / samples.length;
        }
        return {...option, score};
    });
    ranked.sort((a,b) => b.score - a.score || a.tile.id - b.tile.id || a.side.localeCompare(b.side));
    return {type: 'play', tileId: ranked[0].tile.id, side: ranked[0].side};
}

// Frozen baseline 88f7883; diagnostics only for reproducible comparisons.
export const baselineSamples = view => sampledHands(view, publicAbsences(view));
