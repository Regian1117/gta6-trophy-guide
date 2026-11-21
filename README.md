# Palm & Coast Casebook — GTA VI PS5 Trophy Guide & Tracker

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/Regian1117/gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/Regian1117/gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

**Palm & Coast Casebook** is an original, 100% offline-first guide, citation audit ledger, and progress tracker for all **55 PlayStation 5 trophies** in *Grand Theft Auto VI* (`1 Platinum · 2 Gold · 6 Silver · 46 Bronze`, `28 PSN Hidden`, `0 Online`).

## Core Features

- **100% Offline Static App (`app/`):** Zero build step, zero CDN dependencies, zero Google Fonts, zero runtime network calls (`0 KB` net), and zero `eval` or Service Workers.
- **Verified Multi-Site Dataset (`app/data/`):** All 55 official PS5 trophy titles, descriptions, grades, and hidden flags preserved alongside **600 own-words cited guide steps** (`600/600` backed by `2+` Tier-1 outlets across `80` pages / `29` source references) and **24 cross-site split analyses** highlighting disagreements such as `#28 Positive Mental Attitude` (Ch.1 Jason balcony meditation vs. `15/18` 100%-checklist buffer) and `#48 Actions Speak Louder`.
- **5-Stage Platinum Roadmap (`~200h · 4/10 · 1 Playthrough · Zero Mission Replay`):** Stage-by-stage breakdown separating story safeguards, protagonist-gated character strands (`Andy`, `Tyrone`, `Bret`, `Kenton`), co-op heists, Leonida collectibles/ranges (`42` Shooting Range golds, `14` Top Fun Drone hubs, `250/397` stunts), and the `100%` completion buffers (`200/277` vehicles, `100/255` animals, `70/80` challenges).
- **Spoiler Shield & Missable Safeguards:** Unearned story milestones (`12` story spoilers) stay masked with one-click `Reveal`, earned story milestones auto-reveal, and non-story missable warnings (`2` missables, `7` at-risk gates) remain visible at all times.
- **Persistent Progress, Export, Import & Undo:** Saves locally in `localStorage`, supports JSON export and merge/replace import, and includes an automatic pre-import backup for `Undo Last Import`.

## Local Usage & Deterministic Packaging

Serve the static app locally with Node 22:

```bash
node serve.ts --port 8080
```

Build the deterministic make.fun dossier (`dossier.json`) into an output folder:

```bash
MAKEFUN_OUTPUT_DIR=./out node main.ts
```

## License

MIT — see [LICENSE](LICENSE).
