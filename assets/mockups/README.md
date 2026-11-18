# Product mockups (pass 2 + photographic)

Site mockups built from the paid-products overhaul **pass 2** page renders
(`/cursor/stores/bot/bmb-product-previews-pass2/`).

Primary interiors (speech-inside, cue-cards, duties-inside, duties-carry,
bundle-cover) are photographic still-life composites of the real page art —
desk / clipboard / flat-lay scenes so type stays readable. Remaining covers
and interiors are full-bleed page art or navy studio frames. Every file ships
as WebP + JPEG with fixed dimensions so `<img width/height>` and CSS
`aspect-ratio` prevent layout shift.

## Regenerate framed studio set

```bash
node scripts/build-product-mockups.mjs
```

Requires `sharp` (dev dependency). Do not commit `node_modules`.

Photographic composites are produced separately (Runway image edit with the
pass-2 page as a reference) and written over the matching filenames.

## Files

| File | Source | Use |
|------|--------|-----|
| `speech-cover` | p01 | Speech Kit cover |
| `speech-start` | p02 | Speech Start Here |
| `speech-guide` | p04 | Writing guide interior |
| `speech-inside` | p05 + photo composite | Worked example (primary interior) |
| `cue-cards` | p06 + photo composite | Cue cards page |
| `duties-cover` | p07 | Duties Kit cover |
| `duties-inside` | p08 + photo composite | Handbook (primary interior) |
| `duties-planner` | p10 | Guest payments planner |
| `duties-carry` | p11 + photo composite | Carry cards |
| `playbook-cover` | p12 | Playbook cover |
| `playbook-code` | p13 | Stag Code |
| `playbook-games` | p14 | Games contents |
| `playbook-inside` | p15 | Stag Bingo card A (primary) |
| `bundle-cover` | p17 + photo composite | Best Man Set cover |
| `bundle-inside` | p18 | Set Start Here |

Dimensions: covers **760×1074**, interiors **900×1273**. See `manifest.json` for the last studio build.
