# Lift Log

A phone-friendly web app (installable PWA, works offline) for logging lifts. It automatically sets your next targets for progressive overload and syncs with the **"working out"** Claude project.

## How it works
1. **Log**: pick a workout day. Each set shows its target. Tap ✓ if you hit it, or type the weight and reps you actually did.
2. **Finish & update targets**: this uses double progression, the same method as the "working out" project:
   - Each exercise has a rep range, e.g. close-grip bench 8–10.
   - Keep the weight and aim for one more rep per set, up to the top of the range.
   - When **every** set reaches the top of the range, add the increment and go back to the bottom of the range, e.g. 185 × 3×10 → 195 × 8.
   - If most sets fall below the bottom of the range two sessions in a row, the weight drops by one increment.
   - An exercise with no rep range uses fixed per-set targets instead: add weight whenever a set hits its target.
3. **Sync → Share summary**: sends a Markdown log and your current targets to the "working out" project. The summary ends with a request for Claude to review your goals and reply with an updated plan as JSON.
4. **Sync → Import**: paste Claude's whole reply. The app finds the JSON block and replaces your plan.

CSV (for Sheets/Excel) and full JSON backup exports are also available. All data stays on your phone (`localStorage`). Export a JSON backup now and then.

## Starting data
The app ships with the Arms (Tue) day from the project: Tuesday 11/17's session is in history and next Tuesday's targets are in the plan. Import the rest of the program from the project with Sync → Import.

## Run / install
Serve the `app/` folder over HTTPS (e.g. GitHub Pages with source = `/app`, or Netlify/Vercel). Then open it on your phone and choose "Add to Home Screen".
Locally: `python3 -m http.server -d app 8000`.

## Plan JSON format
```json
{"unit":"lb","days":[{"name":"Arms (Tue)","exercises":[{"name":"Close-grip bench","increment":10,"repMin":8,"repMax":10,
  "sets":[{"weight":185,"reps":9},{"weight":185,"reps":8},{"weight":185,"reps":8}]}]}]}
```

## Tests
`node app/test.js`
