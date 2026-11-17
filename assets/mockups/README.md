# Product mockups (interim)

These are interim site mockups for the premium brand overhaul PR.

They give the homepage and kits pages polished on-brand previews (navy / ivory / gold, BMB shield, Nimbus typography) without overwriting the existing `assets/cover-*-r3.jpg` and preview files yet.

## When final product art lands

When the parallel paid-products overhaul agent publishes final product preview images:

1. Replace the files in this folder with the final art (same filenames), **or**
2. Drop new files under `assets/mockups/from-products/` and update the HTML `src` / `<picture>` paths accordingly.

Prefer WebP with JPEG fallback where the page markup supports it:

```html
<picture>
  <source type="image/webp" srcset="assets/mockups/speech-cover.webp">
  <img src="assets/mockups/speech-cover.jpg" width="760" height="1074" alt="…">
</picture>
```

## Files

| File | Use |
|------|-----|
| `speech-cover.jpg` / `.webp` | Speech Kit cover |
| `duties-cover.jpg` / `.webp` | Duties Kit cover |
| `playbook-cover.jpg` / `.webp` | Playbook cover |
| `bundle-cover.jpg` / `.webp` | Bundle cover |
| `speech-inside.jpg` / `.webp` | Speech Kit interior preview |
| `duties-inside.jpg` / `.webp` | Duties Kit interior preview |
| `playbook-inside.jpg` / `.webp` | Playbook interior preview |
| `cue-cards.jpg` / `.webp` | Cue cards preview |

Regenerate with: `node scripts/generate-mockups.mjs` (requires `sharp` installed locally; do not commit `node_modules`).
