const assert = require('assert');
const { nextTargets, e1rm } = require('./overload');
const S = (...p) => ({ sets: p.map(([weight, reps]) => ({ weight, reps })) });
const ex = (o, ...sets) => Object.assign({ sets: sets.map(([weight, reps]) => ({ weight, reps })) }, o);
const show = r => r.map(s => `${s.weight}x${s.reps}${s.change === 'up' ? '^' : s.change === 'down' ? 'v' : ''}`).join(' ');

// --- double progression (rep ranges) ---
// Close-grip bench 185 x 8,7,7, range 8-10 -> stay at 185, one more rep per set
const cg = ex({ increment: 10, repMin: 8, repMax: 10 }, [185, 8], [185, 8], [185, 8]);
assert.strictEqual(show(nextTargets(cg, [S([185, 8], [185, 7], [185, 7])])), '185x9 185x8 185x8');
// 3x10 hit -> 195, reset to bottom of range
assert.strictEqual(show(nextTargets(cg, [S([185, 10], [185, 10], [185, 10])])), '195x8^ 195x8^ 195x8^');
// Rope pushdown 40 x 15,15, range 10-15 -> too light, go up
const pd = ex({ increment: 10, repMin: 10, repMax: 15 }, [40, 12], [40, 12]);
assert.strictEqual(show(nextTargets(pd, [S([40, 15], [40, 15])])), '50x10^ 50x10^');
// reps capped at the top of the range
const hc = ex({ increment: 5, repMin: 12, repMax: 15 }, [40, 15], [40, 12]);
assert.strictEqual(show(nextTargets(hc, [S([40, 15], [40, 9])])), '40x15 40x12');
// two bad sessions in a row -> deload
const bad = S([185, 5], [185, 5], [185, 6]);
assert.strictEqual(show(nextTargets(cg, [bad, bad])), '175x8v 175x8v 175x8v');
// one bad session -> hold weight
assert.strictEqual(nextTargets(cg, [bad])[0].weight, 185);

// --- fixed per-set targets (no rep range) ---
const fb = ex({ increment: 5 }, [185, 8], [195, 6]);
assert.strictEqual(show(nextTargets(fb, [S([185, 8], [195, 4])])), '190x8^ 195x6');
assert.strictEqual(show(nextTargets(fb, [S([0, ''], [195, 3]), S([0, ''], [195, 2])])), '185x8 190x6v');

// first time on a lift: target weight blank -> adopt what was used
const ohp = ex({ increment: 5, repMin: 6, repMax: 10 }, [0, 6], [0, 6], [0, 6]);
assert.strictEqual(show(nextTargets(ohp, [S([95, 8], [95, 7], [95, 6])])), '95x9 95x8 95x7');
assert.strictEqual(nextTargets(ohp, [S([95, 8], [95, 7], [95, 6])])[0].change, 'found');
// timed hold (no weight): +5s per session, capped at top of range
const hold = ex({ kind: 'hold', increment: 0, repMin: 30, repMax: 45, repStep: 5 }, ['', 30], ['', 30]);
assert.strictEqual(show(nextTargets(hold, [S(['', 35], ['', 45])])), '0x40 0x45');
assert.strictEqual(nextTargets(hold, [S(['', 35], ['', 45])])[0].change, 'reps');
// bodyweight / vest work at top of range with no increment -> stay at top
const vest = ex({ increment: 0, repMin: 5, repMax: 8 }, [40, 8], [40, 8]);
assert.strictEqual(show(nextTargets(vest, [S([40, 8], [40, 8])])), '40x8 40x8');
// cardio never auto-progresses
const walk = ex({ kind: 'cardio' }, [2, '']);
assert.strictEqual(nextTargets(walk, [S([2.1, 41])])[0].weight, 2);

assert.strictEqual(e1rm(185, 8), 234);
console.log('all tests passed');
