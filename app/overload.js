// Progressive overload engine. Pure functions, shared by the app and tests.
//
// Exercises WITH a rep range (repMin..repMax) use double progression, matching the
// "working out" project's coaching:
//  - every set reached repMax at the target weight -> add `increment`, reset reps to repMin
//  - most sets fell below repMin in the last two sessions -> drop `increment`
//  - otherwise keep the weight and aim for one more rep per set (capped at repMax)
//    (`repStep` sets the step, e.g. 5 for timed holds measured in seconds)
//  - a set with no target weight yet takes the weight actually used ("find your weight")
// kind 'cardio' (distance/time) never auto-progresses.
//
// Exercises WITHOUT a rep range keep fixed per-set targets:
//  - hit target reps at target weight -> next weight = target + increment
//  - missed by more than `missTolerance` reps on 2 consecutive sessions -> deload
//  - otherwise hold
(function (root) {
  function round(w, step) {
    step = step || 2.5;
    return Math.round(w / step) * step;
  }
  const logged = s => s && s.reps !== '' && s.reps != null;

  function doubleProgression(exercise, last, prev) {
    const inc = Number(exercise.increment) || 0;
    const max = Number(exercise.repMax);
    const min = Number(exercise.repMin) || max;
    const step = Number(exercise.repStep) || 1;
    let tgts = exercise.sets.map(t => ({ weight: Number(t.weight) || 0, reps: Number(t.reps) || min }));
    if (!last || !last.sets.some(logged)) return tgts.map(t => Object.assign({ change: 'none' }, t));
    // No target weight yet (first time on a lift): adopt the weight actually used.
    const used = last.sets.filter(logged).map(a => Number(a.weight) || 0);
    const working = used.length ? Math.max.apply(null, used) : 0;
    const noLoad = exercise.kind === 'hold' || exercise.kind === 'bodyweight';
    tgts = tgts.map((t, i) => t.weight > 0 || noLoad ? t : { weight: Number((last.sets[i] || {}).weight) || working, reps: t.reps, found: true });

    const allTop = tgts.every((t, i) => {
      const a = last.sets[i];
      return logged(a) && Number(a.weight) >= t.weight && Number(a.reps) >= max;
    });
    if (allTop && inc > 0) return tgts.map(t => ({ weight: round(t.weight + inc), reps: min, change: 'up' }));

    const mostlyBelow = sess => {
      if (!sess) return false;
      const done = sess.sets.filter(logged);
      return done.length > 0 && done.filter(a => Number(a.reps) < min).length * 2 > done.length;
    };
    if (inc > 0 && mostlyBelow(last) && mostlyBelow(prev) && tgts[0].weight - inc > 0) {
      return tgts.map(t => ({ weight: round(t.weight - inc), reps: min, change: 'down' }));
    }

    return tgts.map((t, i) => {
      const a = last.sets[i];
      if (!logged(a)) return { weight: t.weight, reps: t.reps, change: t.found ? 'found' : 'hold' };
      const reps = Math.min(max, Math.max(min, Number(a.reps) + step));
      return { weight: t.weight, reps, change: t.found ? 'found' : reps > t.reps ? 'reps' : 'hold' };
    });
  }

  function fixedTargets(exercise, last, prev, opts) {
    const inc = Number(exercise.increment) || 5;
    return exercise.sets.map((target, i) => {
      const t = { weight: Number(target.weight) || 0, reps: Number(target.reps) || 0 };
      const a = last && last.sets[i];
      if (!logged(a)) return Object.assign({ change: 'none' }, t);
      if (Number(a.weight) >= t.weight && Number(a.reps) >= t.reps) {
        return { weight: round(t.weight + inc), reps: t.reps, change: 'up' };
      }
      const p = prev && prev.sets[i];
      const missedNow = t.reps - Number(a.reps) > opts.missTolerance;
      const missedBefore = logged(p) && t.reps - Number(p.reps) > opts.missTolerance;
      if (missedNow && missedBefore && t.weight - inc > 0) {
        return { weight: round(t.weight - inc), reps: t.reps, change: 'down' };
      }
      return Object.assign({ change: 'hold' }, t);
    });
  }

  function nextTargets(exercise, history, opts) {
    opts = Object.assign({ missTolerance: 2 }, opts || {});
    if (exercise.kind === 'cardio') {
      return exercise.sets.map(t => ({ weight: t.weight, reps: t.reps, change: 'none' }));
    }
    const last = history[history.length - 1];
    const prev = history[history.length - 2];
    return Number(exercise.repMax) > 0
      ? doubleProgression(exercise, last, prev)
      : fixedTargets(exercise, last, prev, opts);
  }

  function e1rm(weight, reps) {
    weight = Number(weight); reps = Number(reps);
    if (!weight || !reps) return 0;
    return Math.round(weight * (1 + reps / 30)); // Epley
  }

  const api = { nextTargets, e1rm, round };
  if (typeof module !== 'undefined') module.exports = api; else root.Overload = api;
})(this);
