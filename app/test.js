const assert = require('assert');
const { nextTargets, e1rm } = require('./overload');
const ex = { name: 'Flat Bench', increment: 5, sets: [{ weight: 185, reps: 8 }, { weight: 195, reps: 6 }] };
// hit set 1, missed set 2 by 2 -> up, hold
let r = nextTargets(ex, [{ sets: [{ weight: 185, reps: 8 }, { weight: 195, reps: 4 }] }]);
assert.deepStrictEqual(r.map(s => [s.weight, s.change]), [[190, 'up'], [195, 'hold']]);
// missed by 3+ twice -> deload
r = nextTargets(ex, [{ sets: [{}, { weight: 195, reps: 3 }] }, { sets: [{}, { weight: 195, reps: 2 }] }]);
assert.strictEqual(r[1].weight, 190); assert.strictEqual(r[1].change, 'down');
assert.strictEqual(r[0].change, 'none');
assert.strictEqual(e1rm(185, 8), 234);
console.log('all tests passed');
