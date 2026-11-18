# Product mockups (pass 2)

Site mockups built from the paid-products overhaul **pass 2** page renders
(`/cursor/stores/bot/bmb-product-previews-pass2/`).

Covers are full-bleed page art. Interiors are the real pages framed on a navy
studio backdrop. Every file ships as WebP + JPEG with fixed dimensions so
`<img width/height>` and CSS `aspect-ratio` prevent layout shift.

## Regenerate

```bash
# Default source path is the bot store pass-2 folder
node scripts/build-product-mockups.mjs

# Or point at a local export
BMB_PASS2_DIR=/path/to/pngs node scripts/build-product-mockups.mjs
```

Requires `sharp` (dev dependency). Do not commit `node_modules`.

## Files

| File | Source | Use |
|------|--------|-----|
| `speech-cover` | p01 | Speech Kit cover |
| `speech-start` | p02 | Speech Start Here |
| `speech-guide` | p04 | Writing guide interior |
| `speech-inside` | p05 | Worked example (primary interior) |
| `cue-cards` | p06 | Cue cards page |
| `duties-cover` | p07 | Duties Kit cover |
| `duties-inside` | p08 | Handbook (primary interior) |
| `duties-planner` | p10 | Guest payments planner |
| `duties-carry` | p11 | Carry cards |
| `playbook-cover` | p12 | Playbook cover |
| `playbook-code` | p13 | Stag Code |
| `playbook-games` | p14 | Games contents |
| `playbook-inside` | p15 | Stag Bingo card A (primary) |
| `bundle-cover` | p17 | Best Man Set cover |
| `bundle-inside` | p18 | Set Start Here |

Dimensions: covers **760×1074**, interiors **900×1273**. See `manifest.json` for the last build.
