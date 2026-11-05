import {samplePublicHands} from './bot-sampling-before-speed.mjs';
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
export function chooseBotMove(view, difficulty = 'easy') {
    difficulty = validateDifficulty(difficulty);
    const options = optionsFor(view);
    if (!options.length) return {type: 'pass'};
    const absent = difficulty === 'hard' ? publicAbsences(view) : new Map();
    const samples = difficulty === 'hard' ? samplePublicHands(view).samples : [];
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
