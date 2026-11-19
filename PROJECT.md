# For the "working out" Claude project

This repo holds **Lift Log**, the phone app Kevin uses to log workouts at https://kevchapin3.github.io/Kc/.
It's connected to this project through GitHub. Read these files to coach from real data:

| File | What it is | Updated by |
|---|---|---|
| `data/workouts.md` | **Start here.** Every logged session (actual vs. target per set), plus the current plan and next targets on the phone. | The app, after each workout (GitHub sync) |
| `data/workouts.json` | The same data as JSON: `plan.days[]` and `sessions[]`. | The app |
| `app/plan.js` | The weekly plan shipped with the app. A new `version` updates the phone once: only the days listed in `update`, or the whole plan if `update` is absent. | Claude Code (on request) |

Repo content in a project doesn't refresh on its own. Sync the GitHub content in the project before reviewing new workouts.

## How the app progresses targets (double progression)
- Each exercise has a rep range (`repMin`–`repMax`). Same weight, and aim for one more rep per set (holds: +5 s) up to `repMax`.
- When **every** set hits `repMax`, the weight goes up by `increment` and the reps reset to `repMin`. `increment: 0` = stay at the top (e.g. vest maxed).
- If most sets fall below `repMin` two sessions in a row, the weight drops by one `increment`.
- Weight `0` on a lift = not found yet. The weight used in the first session becomes the target.
- `kind: "cardio"` is logged only, never auto-progressed.

## Notation in workouts.md
`185×8` weight × reps · `+40×6` 6 reps with 40 lb added (vest/DB) · `×8` bodyweight reps · `30s` hold · `+40 · 30s` loaded hold ·
`2 mi / 30 min` cardio · `[…]` = the target for that set · `skip` = not done · `?` = weight not found yet.

## Sending plan changes back
Reply with the **whole** updated plan as one JSON code block in this shape. Kevin pastes your full reply into the app (Sync → Import), or gives it to Claude Code to ship as a new `app/plan.js`.

```json
{"unit":"lb","days":[
 {"name":"Thu AM · home","exercises":[
  {"name":"Weighted chin-up (palms toward you)","addedLoad":true,"increment":5,"repMin":5,"repMax":8,
   "note":"Superset A1 · 90s rest","sets":[{"weight":40,"reps":8},{"weight":40,"reps":7}]}]}]}
```

- Put the weekday in each day's `name` (`Mon`…`Sun`, e.g. `Bike (Wed/Sat)`). The app shows today's days first. A day with no weekday shows every day.
- Keep exercise **names** stable. History is matched by name, so a renamed exercise starts a fresh history.
- Optional fields: `kind` (`bodyweight` · `hold` = reps are seconds · `cardio` = weight is miles, reps are minutes), `addedLoad: true` (weight is added load), `note` (superset, rest, per side, warm-ups), `repStep` (holds, default 5).
