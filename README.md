[![gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/charlyies/gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/charlyies/gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01)

# Leonida Ledger — GTA VI Trophy Guide & Tracker (Night Edition, v2)

An unofficial, fan-made, offline guide and tracker for all **55 PlayStation 5 trophies** of Grand Theft Auto VI (1 Platinum, 2 Gold, 6 Silver, 46 Bronze — 28 hidden, 0 online).

Built for the [make.fun bounty “Build the best GTA 6 trophy guide”](https://make.fun/bounty/gta6-trophy-guide-01) (`gta6-trophy-guide-01`).

## What changed in v2 (Night Edition)

- **Dark theme first, with a working dark/light toggle** (persisted in localStorage) that repaints every view — tracker, roadmap, missables and Sources.
- **Much longer guides:** every trophy's guide is now a full guide in our own words — median 211 words per trophy (11,476 words across the 55), roughly four times the short guides in v1 — each with its own Sources line citing Exophase / PSNProfiles for the official text and OutputLag's launch-day guide (19 Nov 2026) for the methods, and an honest "not confirmed" note where no source pins a method down.
- **New "Next up" planner** in the progress card, a per-grade breakdown, and kind chips that now cover all 55 trophies (Story 12, Side stories 7, Activities 10, Crime 9, Collectibles 4, Money 4, Odd moments 7, 100% completion 1, Platinum 1), plus a Missable & at-risk filter.
- Everything v1 had is kept: checklist saved in localStorage, export/import JSON, search, grade and earned filters, a spoiler toggle that really hides story trophies until earned, progress counters for the 20 trophies PlayStation tracks with a count (0/250 stunts, 0/42 shooting-range medals, …), per-trophy notes, a 6-stage platinum roadmap, a missables page and a Sources & honesty page — still fully offline, static, zero network requests.

## What it is

- **Every trophy, exactly as PlayStation publishes it** — official name, description and grade, verified live on 19 Nov 2026 against [Exophase](https://www.exophase.com/game/grand-theft-auto-vi-psn/trophies/) and [PSNProfiles](https://psnprofiles.com/trophies/43531-grand-theft-auto-vi). No name, description or grade was changed.
- **A guide for each trophy, in our own words**, that cites its sources — what to do, where, and when it can be missed. Where no source pins a place or method down, the guide says so plainly instead of inventing one.
- **A tracker**: a checklist saved in the browser (localStorage), with export and import, search, filters by kind (story, missable, collectibles, activities, crime, side stories, money, online) and by grade, progress counters for the 20 trophies PlayStation tracks with a count (0/250 stunts, 0/42 shooting-range medals, …), and per-trophy notes.
- **A spoiler setting** that hides the names and descriptions of story trophies until they are earned.
- **A roadmap to the platinum** in six stages, and a **missables page**: only one trophy can truly be missed (Positive Mental Attitude — Lucia’s Chapter 1 balcony meditation), one is time-sensitive (Strangers & Freaks — Yago’s Chapter 3 race), and everything else stays available after the credits.

## Run it

Static files, no build step, no network. Serve `app/` with any static server:

```sh
node serve.ts
# then open http://localhost:8080
```

Or open `app/index.html` from a local server of your choice. The page fetches only its own files (`data/trophies.json`).

## Hand-in

`main.ts` (Node 22) copies `app/` and `screenshots/` to `/output` and writes `/output/dossier.json` with `vendor/makefun-frontend.ts`:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Honesty note

GTA VI launched on 19 Nov 2026, the day this guide was written. Methods taken from the launch-day guide (OutputLag, 19 Nov 2026) name it in each trophy’s Sources line, and the ones it marks unconfirmed are marked unconfirmed here too. The roadmap and missable flags are built from the official descriptions themselves.

Not affiliated with Rockstar Games, Sony or PlayStation. No Rockstar logo or official artwork is used.

## License

MIT — see [LICENSE](LICENSE).
