# Leonida Ledger

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/charlyies/gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/charlyies/gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01)

An offline guide and tracker for every trophy in Grand Theft Auto VI on PlayStation 5 — built for the [gta6-trophy-guide-01 bounty](https://make.fun/bounty/gta6-trophy-guide-01).

## What it covers

All 55 PS5 trophies: 1 platinum, 2 gold, 6 silver, and 46 bronze. 28 of them are hidden on PlayStation until earned, and none of them require online play.

Every trophy shows its official name, description, and grade exactly as PlayStation publishes it, plus a guide written in our own words — what to do, where and how, and when it can be missed — with a Sources line beside each one so you can see where every fact came from.

## The tracker

- **Checklist** — tick trophies off as you earn them; progress is saved in your browser (localStorage) and survives a reload.
- **Progress counters** — the trophies PlayStation tracks with a count (stunts, medals, and the rest) show your running total, e.g. 0/250, 0/42.
- **Search** — find any trophy by name in a keystroke.
- **Kind filters** — Story, Missable & at-risk, Collectibles, Activities, Crime, Side stories, Money.
- **Spoiler toggle** — hides the names and descriptions of story trophies until you have earned them, so nothing is spoiled while you play.
- **Notes** — add a personal note to any trophy.
- **Export / import** — save your progress to a JSON file and bring it back on any machine.
- **Platinum roadmap** — a 6-stage plan to the platinum, in the order to earn them, with a progress bar.
- **Missables page** — every missable trophy in one place, with the chapter, mission, or moment where it can slip away.
- **Sources page** — where the trophy list and the guides' facts come from, and an honest note wherever a launch-day detail is still unconfirmed.

## Look and feel

Dark-first theme with a working dark/light toggle. The whole app is plain static files under `app/` — no build step, no network requests at runtime, so it works with the network off.

## How to use it

Open `app/index.html` directly in a desktop browser, or serve the app folder and open it:

```sh
node serve.ts
```

Then visit http://localhost:8080.

## Layout

- `app/index.html` — the app shell
- `app/app.js`, `app/store.js`, `app/filters.js` — tracker, saved progress, and filters
- `app/style.css` — the dark-first theme
- `app/data/trophies.json` — the 55 official trophies, each with its guide and Sources line
- `screenshots/` — renders of the app in a real browser
- `main.ts` — hands the guide in to make.fun

## License

MIT — see `LICENSE`.
