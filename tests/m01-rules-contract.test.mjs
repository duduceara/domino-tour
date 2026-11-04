import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  newGame, auditedBotTurn, assertStateIntegrity, totalScore, isBlocked
} from '../dist/src/engine.js';

// Preserve 5-point pass transfers and 28 tiles; account separately for
// newly authorized fixed round awards and resolved blocked rounds.
for (const dealSize of [6, 7]) {
  test('approved pass contract remains conservative with ' + dealSize + ' tiles', () => {
    let passes = 0, blocked = 0;
    for (let seed = 1; seed <= 30; seed++) {
      let value = seed;
      const s = newGame(100, dealSize, n => {
        value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
        return value % n;
      });
      s.players.forEach(p => { p.kind = 'bot'; });
      const initialTotal = totalScore(s);
      let turns = 0;
      while (s.phase === 'playing' && turns++ < 5000) {
        const scoresBefore = s.players.map(p => p.score);
        const eventsBefore = s.events.length;
        const lastBefore = s.lastPlayed;
        auditedBotTurn(s);
        const events = s.events.slice(eventsBefore);
        const passEvent = events.find(e => e.type === 'pass');
        if (passEvent) {
          passes++;
          assert.equal(passEvent.beneficiary, lastBefore);
          assert.equal(passEvent.delta, -5);
          for (const p of s.players) {
            const award = events.find(e => e.type === 'round-finished');
            const expected = (p.seat === passEvent.seat ? -5 : p.seat === lastBefore ? 5 : 0) + (award?.seat === p.seat ? award.points : 0);
            assert.equal(p.score - scoresBefore[p.seat], expected,
              'only the passante and last valid player may exchange 5 points');
          }
        }
        assertStateIntegrity(s);
        assert.equal(totalScore(s), initialTotal + s.roundAwards.reduce((sum,a)=>sum+a.points,0), 'passes conserve scores; only fixed round awards add points');
      }
      assert.notEqual(s.phase, 'playing', 'simulation must terminate or explicitly block');
      if (s.events.some(e => e.type === 'round-blocked')) {
        blocked++;
        assert.equal(isBlocked(s), false);
        assert.ok(s.events.some(e => e.type === 'blocked-result'));
      }
    }
    assert.ok(passes > 0, 'simulations must actually exercise forced passes');
    assert.ok(blocked > 0, 'simulations must exercise resolved blocked rounds');
  });
}
