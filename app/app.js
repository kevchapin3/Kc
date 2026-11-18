/* Lift Log: log sets, auto-progress targets, export for your workout project. */
const KEY = 'liftlog.v2';
const uid = () => Math.random().toString(36).slice(2, 9);
const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const today = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
const range = ex => ex.repMax ? `${ex.repMin || ex.repMax}–${ex.repMax} reps · +${ex.increment} ${S.unit} at top` : `+${ex.increment} ${S.unit} when hit`;

const sets = (pairs) => pairs.map(([weight, reps]) => ({ weight, reps }));
const done = (pairs) => pairs.map(([weight, reps]) => ({ weight, reps }));
// Starting plan: Arms day from the "working out" project, with targets for next Tuesday.
const ARMS = [
  { id: 'cgbench', name: 'Close-grip bench', increment: 10, repMin: 8, repMax: 10, sets: sets([[185, 9], [185, 8], [185, 8]]),
    last: done([[185, 8], [185, 7], [185, 7]]) },
  { id: 'ezcurl', name: 'EZ curl', increment: 5, repMin: 8, repMax: 12, sets: sets([[65, 12], [65, 11], [65, 10], [65, 9]]),
    last: done([[65, 11], [65, 10], [65, 8], [65, 8]]) },
  { id: 'incdbcurl', name: 'Incline DB curl', increment: 5, repMin: 10, repMax: 12, sets: sets([[20, 12], [20, 11], [20, 10]]),
    last: done([[20, 10], [20, 10], [20, 10]]) },
  { id: 'ohrope', name: 'Overhead rope extension', increment: 5, repMin: 10, repMax: 15, sets: sets([[40, 10], [40, 10], [40, 10]]),
    last: done([[30, 15], [30, 15], [30, 15]]) },
  { id: 'ropehammer', name: 'Rope hammer curl', increment: 5, repMin: 12, repMax: 15, sets: sets([[40, 15], [40, 12]]),
    last: done([[40, 13], [40, 9]]) },
  { id: 'ropepush', name: 'Rope pushdown', increment: 5, repMin: 10, repMax: 15, sets: sets([[50, 10], [50, 10]]),
    last: done([[40, 15], [40, 15]]) },
];
const SEED = {
  version: 2, unit: 'lb',
  plan: { days: [{ id: 'arms', name: 'Arms (Tue)', exercises: ARMS.map(({ last, ...e }) => e) }] },
  sessions: [{ id: 'seed-arms-1', date: '2026-11-17', dayId: 'arms', dayName: 'Arms (Tue)',
    notes: 'Triceps ahead of plan, biceps on track (from "working out" project).',
    exercises: ARMS.map(e => ({ exId: e.id, name: e.name, targets: e.last.map(x => ({ ...x })), sets: e.last })) }],
  draft: null,
};

let S = load();
function load() {
  try { const v = JSON.parse(localStorage.getItem(KEY)); if (v && v.plan) return v; } catch (e) {}
  return structuredClone(SEED);
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }

let tab = 'log';
document.querySelectorAll('nav button').forEach(b => b.onclick = () => {
  tab = b.dataset.tab;
  document.querySelectorAll('nav button').forEach(x => x.classList.toggle('on', x === b));
  render();
});

function render() {
  $('#sub').textContent = `${S.sessions.length} sessions logged`;
  ({ log: renderLog, plan: renderPlan, history: renderHistory, data: renderData })[tab]();
}

/* ---------- Log ---------- */
function startDraft(dayId) {
  const day = S.plan.days.find(d => d.id === dayId);
  S.draft = { id: uid(), date: today(), dayId, dayName: day.name, notes: '',
    exercises: day.exercises.map(ex => ({ exId: ex.id, name: ex.name, range: range(ex),
      targets: ex.sets.map(s => ({ ...s })), sets: ex.sets.map(() => ({ weight: '', reps: '' })) })) };
  save(); render();
}

function renderLog() {
  const v = $('#view');
  if (!S.draft) {
    v.innerHTML = `<div class="card"><h2>Start a workout</h2>
      ${S.plan.days.map(d => `<button class="btn" data-day="${d.id}">${esc(d.name)} <span style="opacity:.75">· ${d.exercises.length} exercises</span></button>`).join('')}
      ${S.plan.days.length ? '' : '<p class="mute">No days in your plan yet. Add one under Plan or import from Sync.</p>'}</div>
      ${S.lastResult ? resultCard(S.lastResult) : ''}`;
    v.querySelectorAll('[data-day]').forEach(b => b.onclick = () => startDraft(b.dataset.day));
    return;
  }
  const d = S.draft;
  v.innerHTML = `<div class="card row"><div><h2 style="margin:0">${esc(d.dayName)}</h2></div>
      <input type="date" id="ddate" value="${d.date}" style="max-width:160px"></div>
    ${d.exercises.map((ex, ei) => `<div class="card"><h2>${esc(ex.name)}</h2>${ex.range ? `<p class="mute" style="margin:-6px 0 6px">${esc(ex.range)}</p>` : ''}
      <table><tr><th>Set</th><th>Target</th><th>${S.unit}</th><th>Reps</th><th></th></tr>
      ${ex.sets.map((s, si) => `<tr class="${s.reps !== '' ? 'done' : ''}"><td>${si + 1}</td>
        <td class="tgt">${ex.targets[si].weight} × ${ex.targets[si].reps}</td>
        <td><input inputmode="decimal" data-e="${ei}" data-s="${si}" data-k="weight" value="${esc(s.weight)}" placeholder="${ex.targets[si].weight}"></td>
        <td><input inputmode="numeric" data-e="${ei}" data-s="${si}" data-k="reps" value="${esc(s.reps)}" placeholder="${ex.targets[si].reps}"></td>
        <td><button class="btn ghost small" data-hit="${ei}.${si}" title="Hit target">✓</button></td></tr>`).join('')}
      </table></div>`).join('')}
    <div class="card"><textarea id="notes" rows="2" placeholder="Notes (sleep, pain, energy…)">${esc(d.notes)}</textarea></div>
    <button class="btn" id="finish">Finish & update targets</button>
    <button class="btn ghost" id="discard">Discard workout</button>`;
  v.querySelectorAll('input[data-k]').forEach(i => i.oninput = () => {
    d.exercises[i.dataset.e].sets[i.dataset.s][i.dataset.k] = i.value; save();
    i.closest('tr').classList.toggle('done', d.exercises[i.dataset.e].sets[i.dataset.s].reps !== '');
  });
  v.querySelectorAll('[data-hit]').forEach(b => b.onclick = () => {
    const [ei, si] = b.dataset.hit.split('.'); const ex = d.exercises[ei];
    ex.sets[si] = { weight: ex.targets[si].weight, reps: ex.targets[si].reps }; save(); render();
  });
  $('#ddate').onchange = e => { d.date = e.target.value; save(); };
  $('#notes').oninput = e => { d.notes = e.target.value; save(); };
  $('#discard').onclick = () => { if (confirm('Discard this workout?')) { S.draft = null; save(); render(); } };
  $('#finish').onclick = finish;
}

function exHistory(exId) {
  // Sessions where this exercise was skipped entirely don't count toward progression.
  return S.sessions.flatMap(s => s.exercises.filter(e => e.exId === exId && e.sets.some(x => x.reps !== ''))
    .map(e => ({ ...e, sets: e.sets.map((x, i) => x.reps === '' ? {} : x) })));
}

function finish() {
  const d = S.draft;
  d.exercises.forEach(ex => ex.sets.forEach(s => {
    if (s.reps !== '' && s.weight === '') s.weight = ''; // keep blanks as skipped
    if (s.weight !== '') s.weight = Number(s.weight); if (s.reps !== '') s.reps = Number(s.reps);
  }));
  S.sessions.push(d);
  const changes = [];
  const day = S.plan.days.find(x => x.id === d.dayId);
  d.exercises.forEach(ex => {
    const planEx = day && day.exercises.find(x => x.id === ex.exId);
    if (!planEx) return;
    const next = Overload.nextTargets(planEx, exHistory(ex.exId));
    changes.push({ name: planEx.name, sets: next.map((n, i) => ({ from: planEx.sets[i], to: n })) });
    planEx.sets = next.map(n => ({ weight: n.weight, reps: n.reps }));
  });
  S.lastResult = { date: d.date, day: d.dayName, changes };
  S.draft = null; save(); render();
}

function resultCard(r) {
  return `<div class="card"><h2>Next ${esc(r.day)} targets</h2><p class="mute">Updated from your ${esc(r.date)} session. ↑ heavier · + more reps · ↓ deload</p>
    ${r.changes.map(c => `<div><b>${esc(c.name)}</b><div class="mute">${c.sets.map((s, i) =>
      `<span class="${s.to.change === 'up' ? 'up' : s.to.change === 'down' ? 'down' : ''}">S${i + 1} ${s.to.weight}×${s.to.reps}${({ up: '↑', down: '↓', reps: '+' })[s.to.change] || ''}</span>`).join(' · ')}</div></div>`).join('')}</div>`;
}

/* ---------- Plan ---------- */
function renderPlan() {
  const v = $('#view');
  v.innerHTML = `<div class="card row"><label>Units</label><select id="unit"><option${S.unit === 'lb' ? ' selected' : ''}>lb</option><option${S.unit === 'kg' ? ' selected' : ''}>kg</option></select></div>
  ${S.plan.days.map((d, di) => `<div class="card">
    <div class="row"><input value="${esc(d.name)}" data-dayname="${di}"><button class="btn ghost small" data-delday="${di}" style="flex:0">Delete day</button></div>
    ${d.exercises.map((ex, ei) => `<div style="border-top:1px solid var(--line);margin-top:10px;padding-top:8px">
      <div class="row"><input value="${esc(ex.name)}" data-p="${di}.${ei}.name">
        </div>
      <div class="row" style="margin-top:6px"><label class="mute">Rep range</label>
        <input inputmode="numeric" placeholder="min" value="${ex.repMin ?? ''}" data-p="${di}.${ei}.repMin">
        <input inputmode="numeric" placeholder="max" value="${ex.repMax ?? ''}" data-p="${di}.${ei}.repMax">
        <label class="mute">+${S.unit}</label><input inputmode="decimal" value="${ex.increment}" data-p="${di}.${ei}.increment"></div>
      <p class="mute" style="margin:4px 0">${ex.repMax ? 'Double progression: add reps until every set hits the max, then add weight.' : 'No range: add weight whenever a set hits its target.'}</p>
      <table><tr><th>Set</th><th>Target ${S.unit}</th><th>Target reps</th><th></th></tr>
      ${ex.sets.map((s, si) => `<tr><td>${si + 1}</td><td><input inputmode="decimal" value="${s.weight}" data-s="${di}.${ei}.${si}.weight"></td>
        <td><input inputmode="numeric" value="${s.reps}" data-s="${di}.${ei}.${si}.reps"></td>
        <td><button class="btn ghost small" data-delset="${di}.${ei}.${si}">✕</button></td></tr>`).join('')}</table>
      <div class="row" style="margin-top:6px"><button class="btn ghost small" data-addset="${di}.${ei}">+ Set</button><button class="btn ghost small" data-delex="${di}.${ei}">Remove exercise</button></div>
    </div>`).join('')}
    <button class="btn ghost" data-addex="${di}">+ Exercise</button></div>`).join('')}
  <button class="btn" id="addday">+ Workout day</button>`;
  const num = x => x === '' ? '' : Number(x);
  $('#unit').onchange = e => { S.unit = e.target.value; save(); };
  v.querySelectorAll('[data-dayname]').forEach(i => i.oninput = () => { S.plan.days[i.dataset.dayname].name = i.value; save(); });
  v.querySelectorAll('[data-p]').forEach(i => i.oninput = () => { const [di, ei, k] = i.dataset.p.split('.'); S.plan.days[di].exercises[ei][k] = k === 'name' ? i.value : num(i.value); save(); });
  v.querySelectorAll('[data-s]').forEach(i => i.oninput = () => { const [di, ei, si, k] = i.dataset.s.split('.'); S.plan.days[di].exercises[ei].sets[si][k] = num(i.value); save(); });
  const act = (sel, fn) => v.querySelectorAll(`[${sel}]`).forEach(b => b.onclick = () => { fn(...b.getAttribute(sel).split('.').map(Number)); save(); render(); });
  act('data-addset', (di, ei) => { const s = S.plan.days[di].exercises[ei].sets; s.push({ ...(s[s.length - 1] || { weight: 0, reps: 10 }) }); });
  act('data-delset', (di, ei, si) => S.plan.days[di].exercises[ei].sets.splice(si, 1));
  act('data-delex', (di, ei) => confirm('Remove exercise?') && S.plan.days[di].exercises.splice(ei, 1));
  act('data-addex', di => S.plan.days[di].exercises.push({ id: uid(), name: 'New exercise', increment: 5, repMin: 8, repMax: 12, sets: [{ weight: 0, reps: 8 }] }));
  act('data-delday', di => confirm('Delete this day?') && S.plan.days.splice(di, 1));
  $('#addday').onclick = () => { S.plan.days.push({ id: uid(), name: 'New day', exercises: [] }); save(); render(); };
}

/* ---------- History ---------- */
function renderHistory() {
  const v = $('#view');
  if (!S.sessions.length) { v.innerHTML = '<div class="card mute">No workouts logged yet.</div>'; return; }
  const best = {};
  S.sessions.forEach(s => s.exercises.forEach(e => e.sets.forEach(x => {
    const r = Overload.e1rm(x.weight, x.reps); if (r > (best[e.name] || 0)) best[e.name] = r;
  })));
  v.innerHTML = `<div class="card"><h2>Estimated 1RM (best)</h2>${Object.entries(best).map(([n, r]) => `<div class="row"><span>${esc(n)}</span><b style="text-align:right">${r} ${S.unit}</b></div>`).join('')}</div>
  ${S.sessions.slice().reverse().map((s, ri) => `<div class="card"><div class="row"><h2 style="margin:0">${esc(s.dayName)}</h2><span class="mute" style="text-align:right">${esc(s.date)}</span></div>
    ${s.exercises.map(e => `<div><b>${esc(e.name)}</b> <span class="mute">${e.sets.filter(x => x.reps !== '').map(x => `${x.weight}×${x.reps}`).join(', ') || 'skipped'}</span></div>`).join('')}
    ${s.notes ? `<p class="mute">${esc(s.notes)}</p>` : ''}
    <button class="btn ghost small" data-del="${S.sessions.length - 1 - ri}">Delete</button></div>`).join('')}`;
  v.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { if (confirm('Delete this session? (Targets are not rolled back.)')) { S.sessions.splice(+b.dataset.del, 1); save(); render(); } });
}

/* ---------- Sync / export ---------- */
function toCSV() {
  const rows = [['date', 'day', 'exercise', 'set', 'target_weight', 'target_reps', 'actual_weight', 'actual_reps', 'unit', 'notes']];
  S.sessions.forEach(s => s.exercises.forEach(e => e.sets.forEach((x, i) =>
    rows.push([s.date, s.dayName, e.name, i + 1, e.targets[i]?.weight, e.targets[i]?.reps, x.weight, x.reps, S.unit, i === 0 ? s.notes : '']))));
  return rows.map(r => r.map(c => /[",\n]/.test(String(c ?? '')) ? `"${String(c).replace(/"/g, '""')}"` : (c ?? '')).join(',')).join('\n');
}

function toMarkdown() {
  const recent = S.sessions.slice(-12);
  return `# Workout log export (${today()})\n\nUnits: ${S.unit}. Format per set: weight×reps (target in brackets).\n\n## Current plan / next targets\n` +
    S.plan.days.map(d => `\n### ${d.name}\n` + d.exercises.map(e => `- ${e.name} (${e.repMax ? `${e.repMin}–${e.repMax} reps, ` : ''}+${e.increment}): ${e.sets.map(s => `${s.weight}×${s.reps}`).join(', ')}`).join('\n')).join('\n') +
    `\n\n## Recent sessions\n` + recent.map(s => `\n### ${s.date} — ${s.dayName}\n` + s.exercises.map(e =>
      `- ${e.name}: ${e.sets.map((x, i) => x.reps === '' ? `skip [${e.targets[i].weight}×${e.targets[i].reps}]` : `${x.weight}×${x.reps} [${e.targets[i].weight}×${e.targets[i].reps}]`).join(', ')}`).join('\n') +
      (s.notes ? `\n- Notes: ${s.notes}` : '')).join('\n') + PROJECT_ASK;
}

const PROJECT_ASK = `

## Request for the "working out" project
Review these sessions against my goals. Adjust exercises, sets, rep targets or weights where needed
(the app uses double progression: same weight, +1 rep per set until every set reaches the top of the range, then +increment and back to the bottom of the range; it deloads after two weak sessions).
Reply with the updated plan as a single JSON code block in exactly this shape so I can import it into my app:

\`\`\`json
{"unit":"lb","days":[{"name":"Arms (Tue)","exercises":[{"name":"Close-grip bench","increment":10,"repMin":8,"repMax":10,"sets":[{"weight":185,"reps":9},{"weight":185,"reps":8}]}]}]}
\`\`\`
`;

function download(name, text, type) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
async function shareOrDownload(name, text, type) {
  try {
    const f = new File([text], name, { type });
    if (navigator.canShare && navigator.canShare({ files: [f] })) return await navigator.share({ files: [f], title: name });
  } catch (e) { if (e.name === 'AbortError') return; }
  download(name, text, type);
}

// Reuse existing exercise ids by name so history keeps linking after an import.
const matchId = name => S.plan.days.flatMap(d => d.exercises).find(e => e.name.toLowerCase() === String(name).toLowerCase())?.id || uid();
function importJSON(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1] : text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1);
  const obj = JSON.parse(raw);
  const days = obj.plan?.days || obj.days;
  if (!Array.isArray(days)) throw new Error('Expected {"plan":{"days":[...]}} or {"days":[...]}');
  days.forEach(d => { d.id ||= uid(); d.exercises = (d.exercises || []).map(e => ({ id: e.id || matchId(e.name), name: e.name, increment: Number(e.increment ?? 5),
    ...(e.repMax ? { repMin: Number(e.repMin ?? e.repMax), repMax: Number(e.repMax) } : {}),
    sets: (e.sets || []).map(s => ({ weight: Number(s.weight ?? s.targetWeight ?? 0), reps: Number(s.reps ?? s.targetReps ?? 0) })) })); });
  if (obj.sessions) { S = { ...structuredClone(SEED), ...obj, plan: { days } }; }
  else { S.plan.days = days; if (obj.unit) S.unit = obj.unit; }
  save();
}

function renderData() {
  const v = $('#view'); const stamp = today();
  v.innerHTML = `<div class="card"><h2>Send to “working out” project</h2>
    <p class="mute">Share the summary into your Claude project. It ends with a request for Claude to reply with an updated plan in JSON — paste that reply below to update your targets.</p>
    <button class="btn" id="md">Share Markdown summary</button>
    <button class="btn ghost" id="copy">Copy summary to clipboard</button>
    <button class="btn ghost" id="csv">Export CSV (all sets)</button>
    <button class="btn ghost" id="json">Export JSON backup</button></div>
  <div class="card"><h2>Import plan from Claude</h2>
    <p class="mute">Paste Claude's whole reply (the JSON block is found automatically), or JSON like <code>{"days":[{"name":"Arms (Tue)","exercises":[{"name":"EZ curl","increment":5,"repMin":8,"repMax":12,"sets":[{"weight":65,"reps":12}]}]}]}</code>, or a full JSON backup.</p>
    <textarea id="imp" rows="5"></textarea>
    <input type="file" id="file" accept=".json,application/json" style="margin-top:8px">
    <button class="btn" id="doimp">Import</button><p id="msg" class="mute"></p></div>`;
  $('#md').onclick = () => shareOrDownload(`workouts-${stamp}.md`, toMarkdown(), 'text/markdown');
  $('#copy').onclick = async () => { try { await navigator.clipboard.writeText(toMarkdown()); $('#copy').textContent = 'Copied ✓'; } catch (e) { download(`workouts-${stamp}.md`, toMarkdown(), 'text/markdown'); } };
  $('#csv').onclick = () => shareOrDownload(`workouts-${stamp}.csv`, toCSV(), 'text/csv');
  $('#json').onclick = () => shareOrDownload(`liftlog-backup-${stamp}.json`, JSON.stringify(S, null, 2), 'application/json');
  $('#file').onchange = async e => { $('#imp').value = await e.target.files[0].text(); };
  $('#doimp').onclick = () => {
    try { importJSON($('#imp').value); $('#msg').textContent = `Imported ${S.plan.days.length} day(s).`; $('#sub').textContent = `${S.sessions.length} sessions logged`; }
    catch (e) { $('#msg').textContent = 'Import failed: ' + e.message; }
  };
}

render();
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js');
