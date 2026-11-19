# Leonida Ledger — Fourth Edition

An offline guide and tracker for the 55 PlayStation 5 trophies of **Grand Theft Auto VI**, built for the make.fun bounty `gta6-trophy-guide-01`.

## What it is

- **Tracker for all 55 trophies** (1 Platinum, 2 Gold, 6 Silver, 46 Bronze; 28 hidden, 0 online), each shown with its official name, description and grade exactly as PlayStation publishes them.
- **A guide in our own words for every trophy** — around 200 words each, each with its own Sources line. Where a method is not confirmed at launch, the guide says so instead of inventing one.
- **Checklist saved in the browser** (localStorage), with **export to a file and import back**, per-trophy notes, and PSN progress counters for the trophies PlayStation tracks (250 stunts, 42 range golds, 100 WAiNK locations, and the rest).
- **Search, grade and earned filters, and kind chips covering all 55** — Story 12, Side stories 7, Activities 10, Crime 9, Collectibles 4, Money 4, Odd moments 7, 100% completion 1, Platinum 1, plus a Missable & at-risk filter.
- **Spoiler toggle** that really hides un-earned story trophies — name, description, roadmap chips and the "Next up" line all stay hidden until the trophy is earned.
- **Six-stage roadmap to the platinum** (~200 hours, long rather than hard) with per-stage progress bars, and a **Missables page** for the one truly missable trophy (Positive Mental Attitude — Lucia's balcony meditation in Chapter 1) and the one at-risk trophy (Strangers & Freaks — the time-sensitive Yago race in Chapter 3).
- **Dark-first theme with a working dark/light toggle**, persisted in the browser.
- **Offline**: static files under `app/`, no build step, no network requests at run time.

## Run it

```sh
node serve.ts
```

Then open the address it prints (the local server, port 8080 by default). Or serve `app/` with any static file server.

## Verify it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

That copies `app/` and `screenshots/` into `out/` and writes `out/dossier.json` with the vendored make.fun library.

## Sources

- Official names, descriptions, grades, hidden flags and PSN counters: **Exophase / PSNProfiles**, checked live 19 Nov 2026 (both agree on all 55).
- Launch-week methods and counts: **OutputLag, GTA 6 trophy list, 19 Nov 2026**; **Push Square, GTA 6 trophy guide & roadmap, 19 Nov 2026**; **Planet GTA 6**; **GGRecon** (GTABase).
- Honesty notes: five hidden trophies (In The Beginning…, Capital Offense, Bad Luck, I Guess, The Truth Is Out There, Ten Pin) have no confirmed unlock method at launch; the Personal Best method and the balcony-meditation link for Positive Mental Attitude are reported but unconfirmed. The guide says so in each case.

## Notes

- Unofficial fan guide. Grand Theft Auto VI is developed and published by Rockstar Games. No Rockstar logo, artwork, box art or game screenshot is used anywhere; the look is our own.
- Trophy names and descriptions are shown as PlayStation publishes them; all guide text is written for this entry.
- License: MIT (see `LICENSE`).
