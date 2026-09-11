# Angul-It

An interactive, multi-stage CAPTCHA built with Angular. Every challenge is implemented from
scratch — no external CAPTCHA library — to practice state management, form validation,
guarded routing, and accessible UI in a real Angular app.

## How it works

- **Home** → **Captcha** → **Result**, connected entirely through the Angular Router (no full
  page reloads).
- A session has one stage per challenge type, in a random order each time:
  - **Math Puzzle** — solve a generated arithmetic expression.
  - **Pattern Sequence** — find the next number in a sequence.
  - **Color Grid** — select every tile matching a target color.
- Progress is held in a signal-based `CaptchaState` service and mirrored to `localStorage` on
  every change, so a page refresh resumes exactly where you left off instead of losing state.
- Two route guards enforce the flow in both directions: `/result` redirects back to `/captcha`
  unless every stage is complete, and `/captcha` redirects to `/result` once the session is
  already finished (so a stale, already-completed stage never gets re-shown).
- Built with accessibility in mind: labeled inputs, an `aria-live` region for pass/fail
  feedback, named (not color-only) accessible labels on the color-grid tiles, and explicit
  focus management moving between stages.

## Project structure

```
src/app/
├── models/          Challenge and session type definitions
├── services/         CaptchaState (persistence) + challenge generators/validation
├── guards/           Route guards for /captcha and /result
├── pages/
│   ├── home/         Landing page
│   ├── captcha/       Renders the current stage, validates answers
│   └── result/        Summary + restart, once every stage is complete
└── testing/           Shared test helpers
```

## Getting started

```bash
npm install
npm start        # ng serve — http://localhost:4200
npm test         # ng test — Vitest, runs the full unit test suite
npm run build    # ng build — production build to dist/
```

## Tech

Angular 21 (standalone components, signals, functional route guards), Reactive Forms, Vitest.
No external CAPTCHA dependency — check `package.json`, it's just `@angular/*` and `rxjs`.
