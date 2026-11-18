// Progressive overload engine. Pure functions, shared by the app and tests.
// Rule (per set, "double progression"):
//  - hit target reps at target weight  -> next weight = target + increment
//  - missed by more than `missTolerance` reps on 2 consecutive sessions -> deload by increment
//  - otherwise hold the target
(function (root) {
  function round(w, step) {
    step = step || 2.5;
    return Math.round(w / step) * step;
  }

  function nextTargets(exercise, history, opts) {
    opts = Object.assign({ missTolerance: 2 }, opts || {});
    var inc = Number(exercise.increment) || 5;
    var last = history[history.length - 1];
    var prev = history[history.length - 2];
    return exercise.sets.map(function (target, i) {
      var t = { weight: Number(target.weight) || 0, reps: Number(target.reps) || 0 };
      var a = last && last.sets[i];
      if (!a || a.reps === '' || a.reps == null) return Object.assign({ change: 'none' }, t);
      var aw = Number(a.weight), ar = Number(a.reps);
      if (aw >= t.weight && ar >= t.reps) {
        return { weight: round(t.weight + inc), reps: t.reps, change: 'up' };
      }
      var missedNow = t.reps - ar > opts.missTolerance;
      var p = prev && prev.sets[i];
      var missedBefore = p && t.reps - Number(p.reps) > opts.missTolerance;
      if (missedNow && missedBefore && t.weight - inc > 0) {
        return { weight: round(t.weight - inc), reps: t.reps, change: 'down' };
      }
      return Object.assign({ change: 'hold' }, t);
    });
  }

  function e1rm(weight, reps) {
    weight = Number(weight); reps = Number(reps);
    if (!weight || !reps) return 0;
    return Math.round(weight * (1 + reps / 30)); // Epley
  }

  var api = { nextTargets: nextTargets, e1rm: e1rm, round: round };
  if (typeof module !== 'undefined') module.exports = api; else root.Overload = api;
})(this);
