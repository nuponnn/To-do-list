# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The owner and a small private circle of known people (friends/family) planning their personal tasks. Each person signs in to their own account and works alone; the circle is just who gets an account, not a collaboration group.

## Product Purpose

A calendar-centered to-do app for planning personal tasks over days and months. Success means a task can be captured once as a reusable template, stamped onto any number of days, tracked to completion, and read at a glance by color — without fighting the tool.

## Positioning

Calendar-stamp planning: quick todos are reusable templates you stamp onto calendar days in batch (with undo/redo before committing), rather than a flat list you edit one item at a time. Any neighboring to-do app would have to copy the stamp-onto-days workflow to match it.

## Operating Context

- Firebase project `to-do-list-ea02b`: Auth, Firestore (region `asia-southeast1`), Hosting (deploys `dist/`, SPA rewrites); emulators configured for local dev.
- All user data is partitioned under `UserData/{uid}` (and `AuthUser/{uid}`); `uid` is the partition key for todos, quick todos, and saved colors.
- Client state is cache-first (one-shot fetch + local patch in React Context); no realtime sync — changes from another device require a refresh.
- Verification ritual: `npm run lint` and `npm run build` must pass (both currently green).
- Project documentation lives in Thai (`Flow.md`, `REFACTOR.md`); engineering notes in git history are mixed Thai/English.

## Capabilities and Constraints

- Core surfaces: login/signup (`/`), month calendar (`/calendar`), per-day task list (`/to-do-list/:day`).
- Quick todos: reusable templates, stampable onto multiple days with pending/undo/redo before confirm.
- Color tags: any hex color (native picker + 8 presets), optional per-task text color with automatic WCAG-contrast fallback; "no color" is absence of the field, not a sentinel value.
- Saved colors per user (Firestore + localStorage mirror for fast load).
- **Data is private per account** — Firestore rules grant only the owner access; no cross-user sharing, confirmed as the intended model.
- **i18n is required: both Thai and English UI** — a durable constraint; existing UI strings are English and must become switchable/localizable.
- Existing Firestore data must keep working: parsers in `src/components/services.tsx` and legacy color migration (`#ffffff` → no color) are compatibility surfaces; schema changes update parsers in the same change.
- Offline awareness via network banner; writes are optimistic-patched locally after Firestore succeeds.
- Undecided product facts (recorded, not invented): no realtime sync yet (listed as future work in `REFACTOR.md`); no test suite yet.

## Evidence on Hand

- `Flow.md` — full current system flow (providers, routing, auth, Firestore, calendar/todolist/color flows), updated 2026-10-06.
- `REFACTOR.md` — prioritized technical backlog, updated 2026-10-05.
- Running code with deployed history (Firebase Hosting, git log shows deploys) and real user data in Firestore.
- Absences future work must not fabricate: no marketing copy, no testimonials/press/benchmarks, no DESIGN.md, no design tokens, no logo beyond `public/favicon.svg`, no accessibility audit.

## Product Principles

1. Protect the stamp-onto-days workflow — it is the product; features that dilute or complicate it need strong justification.
2. One account sees only its own data, always; nothing may leak across `uid` boundaries.
3. Both Thai and English speakers are first-class users; UI copy is not done until it works in both.
4. Existing users' data never breaks — schema, parser, and color changes ship with compatibility handling.
5. Serve the small circle's real planning habits with depth; this is not a public growth product, so skip sign-up funnels, social proof, and scale machinery.

## Accessibility & Inclusion

No product-specific standard established yet; WCAG-based contrast for task text colors is already a built-in behavior (`autoTextColor` luminance calculation) and should be the baseline for any new colored UI. Thai and English text rendering both required.
