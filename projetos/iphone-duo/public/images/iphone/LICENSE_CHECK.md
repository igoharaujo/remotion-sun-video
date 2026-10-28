# License audit — iPhone Duo video

Checked 2026-10-22. Every license was read from the file's own Wikimedia Commons page through the
MediaWiki API (`extmetadata.LicenseShortName` / `Artist`), not from search snippets. Full records,
including source URLs, are in `credits.json`.

## Images used in the video (`public/images/iphone/`)

Sources are Wikimedia Commons only. No Apple press images were used: I could not find or verify an
official Apple press kit for a foldable iPhone. No blogs, Pinterest or stock sites.

| File | Where | License | Author | Source | OK |
|---|---|---|---|---|---|
| `fold_z7_unfolded.webp` | s09 crease illustration, s10 thumbnail | CC0 | Matabalt | [Commons page](https://commons.wikimedia.org/wiki/File:Samsung_Galaxy_Z_Fold_7_Unfolded.jpg) | ✅ |
| `fold_pixel_fold.webp` | s05a backplate | CC0 | Syced | [Commons page](https://commons.wikimedia.org/wiki/File:Google_Pixel_Fold,_shown_in_Shibuya_Stream_16.jpg) | ✅ |
| `oled_subpixels.webp` | s03 macro lens, s04 OLED panel | CC BY-SA 4.0 | TECH EDU | [Commons page](https://commons.wikimedia.org/wiki/File:OLED_SUBPIXELS.jpg) | ✅ |
| `lcd_backlight_leds.webp` | s04 LCD panel | CC BY-SA 3.0 | RobertKuhlmann | [Commons page](https://commons.wikimedia.org/wiki/File:LCD-Hintergrundbeleuchtung_mit_LEDs.JPG) | ✅ |
| `titanium_cetko.webp` | s05 titanium inset | CC0 | Cetko | [Commons page](https://commons.wikimedia.org/wiki/File:Cetko_titanium.jpg) | ✅ |
| `hinge_mobile_phone.webp` | s07 backplate | CC BY-SA 3.0 | Ray_go | [Commons page](https://commons.wikimedia.org/wiki/File:Hinge_of_Mobile_Phone.jpg) | ✅ |
| `crease_z_flip.webp` | s01 hook backplate | CC BY 4.0 | Grace R. Samson | [Commons page](https://commons.wikimedia.org/wiki/File:Samsung_Galaxy_Z_Flip_fold_cr.jpg) | ✅ |

Downloaded, then removed because they read badly on screen (not in the video, no obligations):
`fold_z5_pair` (store shelf), `oled_switch_macro` (too dark), `oled_s22_rgb_matrix` (reads as an icon),
`oled_structure_diagram` and `lcd_layer_layout` (white-background diagrams), `titanium_anodized_plates`
(coloured lettering).

Drawn procedurally in code instead (no usable openly licensed source found): display layer stack,
macro pixel grid, hinge assembly, V-fold vs teardrop diagrams, stress heatmap, comparison bars, coin.

The Galaxy Z Fold7 photo in s09 carries an on-screen note ("ILUSTRAÇÃO · FOTO DE REFERÊNCIA:
DOBRÁVEL ATUAL"); the crease line drawn over it is an illustration, not a measurement of that phone.

### What the licenses require

- **CC0**: nothing.
- **CC BY**: credit the author and link the license.
- **CC BY-SA**: credit + license link. Share-alike applies to adaptations of the image itself. The
  photos are shown as recognisable, separate elements (resized and cropped only), so the video as a
  whole is not an adaptation of them.

Attribution text for the video description:

- OLED SUBPIXELS.jpg: TECH EDU, CC BY-SA 4.0, via Wikimedia Commons
- LCD-Hintergrundbeleuchtung mit LEDs.JPG: RobertKuhlmann, CC BY-SA 3.0, via Wikimedia Commons
- Hinge of Mobile Phone.jpg: Ray_go, CC BY-SA 3.0, via Wikimedia Commons
- Samsung Galaxy Z Flip fold cr.jpg: Grace R. Samson, CC BY 4.0, via Wikimedia Commons

## Sound effects (`public/sfx/iph_*.wav`)

All from the Freesound API, all **CC0** (no attribution required; credited anyway in `public/sfx/CREDITS.json`).
The files are the API's HQ mp3 previews re-encoded to wav, with leading silence trimmed.

| File | License | Author | Freesound | Query |
|---|---|---|---|---|
| `iph_tick.wav` | CC0 1.0 | Jummit | [#528561](https://freesound.org/people/Jummit/sounds/528561/) | "ui tick" |
| `iph_chime.wav` | CC0 1.0 | marlonnnnnn | [#351878](https://freesound.org/people/marlonnnnnn/sounds/351878/) | "startup chime" |
| `iph_sparkle.wav` | CC0 1.0 | BMacZero | [#94132](https://freesound.org/people/BMacZero/sounds/94132/) | "electric spark" |
| `iph_power_off.wav` | CC0 1.0 | squidge316 | [#443465](https://freesound.org/people/squidge316/sounds/443465/) | "power off" |
| `iph_shing.wav` | CC0 1.0 | Qat | [#107589](https://freesound.org/people/Qat/sounds/107589/) | "metal shing" |
| `iph_ratchet.wav` | CC0 1.0 | AlaskaRobotics | [#551497](https://freesound.org/people/AlaskaRobotics/sounds/551497/) | "ratchet click" |
| `iph_riser.wav` | CC0 1.0 | BeaconStudio | [#859482](https://freesound.org/people/BeaconStudio/sounds/859482/) | "cinematic riser short" |
| `iph_boom.wav` | CC0 1.0 | AudioPapkin | [#430977](https://freesound.org/people/AudioPapkin/sounds/430977/) | "cinematic impact boom" |
| `iph_coin.wav` | CC0 1.0 | jmaimarc | [#19778](https://freesound.org/people/jmaimarc/sounds/19778/) | "coin drop metallic" |
| `iph_whoosh.wav` | CC0 1.0 | ludvique | [#71852](https://freesound.org/people/ludvique/sounds/71852/) | "whoosh soft" |
| `iph_swoosh.wav` | CC0 1.0 | xkeril | [#701104](https://freesound.org/people/xkeril/sounds/701104/) | "whoosh soft" |
| `iph_boom_low.wav` | CC0 1.0 | AudioPapkin | [#430978](https://freesound.org/people/AudioPapkin/sounds/430978/) | "cinematic impact boom" |

`iph_drone.wav` is synthesized by `scripts/gen-drone-iphone.mjs` (no third-party audio).
