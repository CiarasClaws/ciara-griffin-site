# Rebuilding the name letterforms + navy film grade

`extract-glyphs.py` turns Kira's glyph-design screenshots (cream letter on
black with labelled type guides: Ascender/Cap/x-Height/Baseline/Descender)
into the composed name images at `assets/name/`.

Usage: `python3 scripts/extract-glyphs.py <dir-with-letter-pngs> assets/name`
Input names expected: C, i1, a1, r1, a2, G, r2, i2, f, n (.png each).
It strips the guide lines + edge labels, registers every glyph by its own
baseline/cap from the guides, thins vertical stems slightly (hthin k=2),
composes "Ciara" / "Griffin" at cap=300px, and prints the baselines that
must match NAME_META in assets/js/loom.js.

The film/clip navy grade used across the site (and the Jacquard clips) is a
luminance gradient-map to the site ramp:
0.00 #04070F · 0.35 #1C2A45 · 0.65 #5E769D · 0.88 #A9BEDC · 1.00 #E8EFF8
applied after normalising L with (l-0.06)/0.88 then gamma 1.12.
Source letter screenshots: mini Desktop 19/07/2026; film master:
iMac Drive1 "*Da Vinci Projects/Projects/Website video.mov" (51MB, 30s);
footage provenance: Jacquard loom, The Henry Ford, Object ID 34.797.1.
