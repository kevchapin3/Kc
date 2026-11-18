# Lift Log

A phone-friendly web app (installable PWA, works offline) for logging lifts. It automatically sets your next targets for progressive overload and syncs with the **"working out"** Claude project.

## How it works
1. **Log**: pick a workout day. Each set shows its target. Tap ✓ if you hit it, or type the weight and reps you actually did.
2. **Finish & update targets**: per set, if you hit the target weight and reps, next time's weight goes up by the exercise's increment. If you miss by more than 2 reps two sessions in a row, the weight drops by one increment. Otherwise the target stays the same.
3. **Sync → Share summary**: sends a Markdown log and your current targets to the "working out" project. The summary ends with a request for Claude to review your goals and reply with an updated plan as JSON.
4. **Sync → Import**: paste Claude's whole reply. The app finds the JSON block and replaces your plan.

CSV (for Sheets/Excel) and full JSON backup exports are also available. All data stays on your phone (`localStorage`). Export a JSON backup now and then.

## Run / install
Serve the `app/` folder over HTTPS (e.g. GitHub Pages with source = `/app`, or Netlify/Vercel). Then open it on your phone and choose "Add to Home Screen".
Locally: `python3 -m http.server -d app 8000`.

## Plan JSON format
```json
{"unit":"lb","days":[{"name":"Chest","exercises":[{"name":"Flat Bench","increment":5,"sets":[{"weight":185,"reps":8}]}]}]}
```

## Tests
`node app/test.js`
