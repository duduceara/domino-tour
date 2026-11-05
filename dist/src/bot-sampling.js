// All inputs are the acting player's view: no state, opponent hands or draw pile.
const tiles = [];
for (let a = 0; a <= 6; a++) for (let b = a; b <= 6; b++) tiles.push({id: tiles.length, a, b});
export function inferPublicConstraints(view) {
    const constraints = new Map(view.players.map(p => [p.seat, {absent: new Set()}]));
    let inconsistent = false;
    for (const event of view.history ?? []) {
        if (event.type !== 'pass' && event.type !== 'play') continue;
        const constraint = constraints.get(event.seat);
        if (!constraint) { inconsistent = true; continue; }
        if (event.type === 'pass') {
            // With no draws, these absences remain true until the next deal.
            for (const value of [event.left, event.right]) if (Number.isInteger(value) && value >= 0 && value <= 6) constraint.absent.add(value);
        } else if (event.type === 'play') {
            const tile = tiles[event.tileId];
            if (!tile || constraint.absent.has(tile.a) || constraint.absent.has(tile.b)) inconsistent = true;
        }
    }
    return {constraints, inconsistent};
}
function publicRandom(view) {
    let seed = 2166136261;
    const data = [view.turn, view.ownHand.map(t => t.id).sort((a,b)=>a-b), view.chain.map(t=>t.id), view.players.map(p=>[p.seat,p.handCount]), view.sleepingCount, view.history?.filter(e=>e.type==='play'||e.type==='pass')];
    for (const char of JSON.stringify(data)) seed = Math.imul(seed ^ char.charCodeAt(0), 16777619) >>> 0;
    const next = () => { seed = (seed + 0x6D2B79F5) >>> 0; let n = seed; n = Math.imul(n ^ n >>> 15, n | 1); n ^= n + Math.imul(n ^ n >>> 7, n | 61); return (n ^ n >>> 14) >>> 0; };
    return maximum => {
        // Rejection avoids modulo bias, including completion counts above 2^32.
        const range = maximum <= 0x100000000 ? 0x100000000 : 0x20000000000000;
        const limit = Math.floor(range / maximum) * maximum;
        let value;
        do { value = range === 0x100000000 ? next() : (next() & 0x1fffff) * 0x100000000 + next(); } while (value >= limit);
        return value % maximum;
    };
}
export function samplePublicHands(view, requested = 48) {
    if (!Number.isInteger(requested) || requested < 1 || requested > 48) throw new Error('Sample count must be 1..48');
    const {constraints, inconsistent} = inferPublicConstraints(view);
    const samples = [], metrics = {requested, generated: 0, states: 0, exhausted: false, inconsistent, method: 'conditional-counting'};
    const seats = view.players.filter(p=>p.seat !== view.turn).map(p=>p.seat);
    const counts = seats.map(seat=>view.players.find(p=>p.seat===seat).handCount);
    const seen = new Set([...view.ownHand,...view.chain].map(t=>t.id));
    const pool = tiles.filter(t=>!seen.has(t.id));
    const sleeping = view.sleepingCount ?? pool.length-counts.reduce((a,b)=>a+b,0);
    if (inconsistent || seats.length !== 3 || counts.some(n=>!Number.isInteger(n)||n<0||n>7) || !Number.isInteger(sleeping) || sleeping<0 || sleeping>4 || counts.reduce((a,b)=>a+b,0)+sleeping!==pool.length) {
        metrics.inconsistent = true; return {samples, metrics};
    }
    const random = publicRandom(view);
    const allowed = tile => seats.reduce((mask,seat,index)=>{
        const c = constraints.get(seat);
        return mask | (!c.absent.has(tile.a)&&!c.absent.has(tile.b) ? 1<<index : 0);
    },sleeping ? 8 : 0);
    if (pool.every(tile=>allowed(tile)===(sleeping?15:7))) {
        metrics.method='unconstrained-shuffle';
        for (let sample=0;sample<requested;sample++) {
            const shuffled=[...pool];
            for (let i=shuffled.length-1;i>0;i--) {const j=random(i+1);[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]];}
            let offset=0;
            samples.push(new Map(seats.map((seat,i)=>{const hand=shuffled.slice(offset,offset+counts[i]).map(t=>({...t}));offset+=counts[i];return [seat,hand];})));
        }
        metrics.generated=samples.length;return {samples,metrics};
    }
    const ordered = pool.map(tile=>({tile,mask:allowed(tile)})).sort((a,b)=>{
        const bits = n => Number(!!(n&1))+Number(!!(n&2))+Number(!!(n&4))+Number(!!(n&8));
        return bits(a.mask)-bits(b.mask)||a.tile.id-b.tile.id;
    });
    const memo = new Map();
    function completions(index, capacity) {
        const sleepLeft = ordered.length-index-capacity.reduce((a,b)=>a+b,0);
        if (sleepLeft<0 || sleepLeft>sleeping) return 0;
        if (index===ordered.length) return capacity.every(n=>n===0) ? 1 : 0;
        const key = [index,...capacity].join(',');
        if (memo.has(key)) return memo.get(key);
        if (++metrics.states > 50000) throw new Error('sampling-budget');
        const {mask} = ordered[index]; let total = 0;
        for (let bucket=0;bucket<4;bucket++) {
            if (!(mask & 1<<bucket) || (bucket===3 ? !sleepLeft : !capacity[bucket])) continue;
            const nextCapacity = [...capacity];
            if (bucket<3) nextCapacity[bucket]--;
            total += completions(index+1,nextCapacity);
        }
        memo.set(key,total); return total;
    }
    try {
        const total = completions(0,counts);
        metrics.validAssignments = total;
        if (!total) {metrics.inconsistent=true;return {samples,metrics};}
        // Every assignment is weighted by its exact number of valid completions.
        // Unlike greedy filling, this does not overrepresent early-seat choices.
        for (let sample=0;sample<requested;sample++) {
            const hands = new Map(seats.map(seat=>[seat,[]]));
            let capacity=[...counts];
            for (let index=0;index<ordered.length;index++) {
                const {tile,mask}=ordered[index];
                const sleepLeft=ordered.length-index-capacity.reduce((a,b)=>a+b,0);
                let ticket=random(completions(index,capacity));
                for (let bucket=0;bucket<4;bucket++) {
                    if (!(mask&1<<bucket)||(bucket===3?!sleepLeft:!capacity[bucket])) continue;
                    const nextCapacity=[...capacity];
                    if (bucket<3) nextCapacity[bucket]--;
                    const weight=completions(index+1,nextCapacity);
                    if (ticket>=weight) {ticket-=weight;continue;}
                    if (bucket<3) hands.get(seats[bucket]).push({...tile});
                    capacity=nextCapacity;break;
                }
            }
            samples.push(hands);
        }
    } catch (error) {
        if (error.message !== 'sampling-budget') throw error;
        metrics.exhausted=true;
    }
    metrics.generated=samples.length;
    return {samples,metrics};
}
