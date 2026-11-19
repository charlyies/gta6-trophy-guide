# Leonida Ledger — Rebuilt Edition

An offline guide and tracker for all **55 Grand Theft Auto VI trophies** on PlayStation 5, built for the make.fun bounty `gta6-trophy-guide-01`.

## What it is

- **Tracker** — every trophy with its official name, description and grade, a checklist saved in the browser (localStorage), export to a file and import back, search, grade and earned filters, kind chips covering all 55, per-trophy notes, and a progress card with per-grade counts and a Next-up planner.
- **Spoiler setting** — hides the names and descriptions of hidden story trophies until they are earned, in the list, in the detail panel, in the roadmap chips and in the Next-up line.
- **Cited guides** — each trophy has a long guide (median 212 words) written in our own words, each with its own Sources line. Official names and descriptions are shown as PlayStation publishes them.
- **Platinum roadmap** — six stages in play order, each with its own progress bar and trophy chips.
- **Missables page** — the one missable trophy (Positive Mental Attitude, Chapter 1 balcony meditation) and the one at-risk trophy (Strangers & Freaks, Yago's time-sensitive race in Chapter 3), with the full guides for both.
- **Sources & honesty page** — where the list and the methods come from, and what is not pinned down yet (six odd-moment trophies have no confirmed method at launch, and this guide says so).

## Facts (verified live 19 Nov 2026)

55 trophies: 1 platinum, 2 gold, 6 silver, 46 bronze. 28 hidden, 0 online — every trophy is single-player. Names, descriptions and grades cross-checked between Exophase and PSNProfiles (via Planet GTA 6 and OutputLag); launch-day methods from the OutputLag GTA 6 trophy list of 19 November 2026. Around 200 hours for the platinum, long rather than hard: no difficulty trophies, no online trophies, no mission medals, no mission replay.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080. No build step, no network: the app loads only its own files under `app/`, and your progress never leaves your browser.

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

That copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored make.fun library.

## License

MIT — see `LICENSE`. Grand Theft Auto VI is developed and published by Rockstar Games. No Rockstar logo, artwork, box art or game screenshot is used in this guide; the look is our own.
