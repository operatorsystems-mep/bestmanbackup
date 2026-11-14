# Social fixtures

PNG assets are not stored here. The render suite reads `BMB_SOCIAL_FIXTURES`, or this directory if that variable is unset.

Expected files:

- `PIN_01_speech_they_quote.png` 1000×1500, 70px corner clearance
- `PIN_02_brother_20_years.png` 1000×1500, 70px corner clearance
- `PIN_03_phone_notes.png` 1000×1500, 70px corner clearance
- `PIN_04_night_before.png` 1000×1500, 70px corner clearance
- `PIN_05_stag_legend.png` 1000×1500, 70px corner clearance
- `IG_01_never_open.png` 1080×1350, 60px corner clearance
- `IG_02_room_goes_quiet.png` 1080×1350, 60px corner clearance
- `IG_03_cards_not_phone.png` 1080×1350, 60px corner clearance
- `IG_04_who_pays.png` 1080×1350, 60px corner clearance
- `IG_05_carousel_cover_5_parts.png` 1080×1350, 60px corner clearance
- `IG_05_slide_02_introduce.png` 1080×1350, 60px corner clearance
- `IG_05_slide_03_true_story.png` 1080×1350, 60px corner clearance
- `IG_05_slide_04_what_it_means.png` 1080×1350, 60px corner clearance
- `IG_05_slide_05_celebrate.png` 1080×1350, 60px corner clearance
- `IG_05_slide_06_toast.png` 1080×1350, 60px corner clearance
- `IG_05_slide_07_kit_cta.png` 1080×1350, 60px corner clearance
- `STORY_01_before_you_walk_in.png` 1080×1920, 60px corner clearance

Run:

```bash
BMB_SOCIAL_FIXTURES=/path/to/pngs npm run test:render
```

When this directory has no PNGs and `BMB_SOCIAL_FIXTURES` is unset, the render suite skips.
