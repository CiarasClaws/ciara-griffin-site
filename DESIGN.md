# CIARA GRIFFIN — master brand site
## Design document, 10/07/2026

Built by Fable as the master personal-brand site: the room where the five ventures meet
the person who makes them. Self-hosted static build (the-retinue-site model). Will be
screen-recorded for a ~500k podcast audience.

## Concept: THE LOOM

The thesis line every Ciara Griffin piece traces back to: **we create tools and they
create us.** Text and textile share a root (Latin *texere*, to weave). The Jacquard
loom is the ancestor of every computer. And the subject of this page is a person who
is, in her words, an amalgam of six brands.

So the page is a loom.

- Six threads weave in a dark 3D void behind her name (Three.js, code-drawn; the
  hard-won WCT lesson: generated painterly surfaces get clocked instantly, hand-drawn
  and code-drawn reads sophisticated).
- One warp thread is hers (cream). Five weft threads carry the five brand hues.
- **The signature element: one unbroken thread travels the entire page** as an SVG
  spine, drawn on by scroll. It passes through five full-register brand sections and
  changes idiom inside each: a quiet hairline in The Retinue, a live network edge in
  Epistemic Net, a lime zigzag stitch in WCT, a die-straight mono rule in SAT, an IKB
  line with a misregistered pink ghost in ATTCU.
- In the coda the six threads braid (scroll-scrubbed, and it RESOLVES: the braid
  becomes the thesis line set in cloth). Arcs must arrive somewhere; nothing fades to
  black.

## The one aesthetic risk

Each brand section shifts the ENTIRE environment into that brand's real register:
background, ink, typeface, cursor behaviour, motion idiom. Most sites hold one design
system; this page deliberately speaks six, because the subject is the amalgam. The
master register (ink void, cream, metallic chrome) is the loom that holds the shifts
together, and it siblings the ciaragriffin.link foyer (her established personal
surface) without restyling it.

## Master register

- Ink void `#0B0D12` (foyer sibling), lifted panels `#12151C`
- Cream `#F3EFE7` (foyer cream) = her thread, body text on dark
- Metallic `#B8B2A6` = chrome, labels, hairlines
- Type: **Fraunces** (variable, opsz 9..144; display at high optical size with a
  touch of wonk; body at text optical size) + **Fragment Mono** for chrome/labels
  ("loom notation": thread counts, section marks)
- Grain: subtle SVG turbulence, as on her existing surfaces

## The five wefts (real registers, from the live sites + brand docs)

| # | Brand | Ground | Ink | Accent(s) | Face quoted | Signature interaction |
|---|-------|--------|-----|-----------|-------------|----------------------|
| I | The Retinue | (recon) | (recon) | (recon) | (recon) | calm hairlines, slow reveal, the quiet door |
| II | Epistemic Net | (recon) | (recon) | (recon) | (recon) | living network canvas, hover wakes neighbourhoods |
| III | WCT | `#f5f5f5` | `#000` | lime `#CBFF04`, magenta `#E33294` | Anonymous Pro + Helvetica | tool cards, 1.5px borders, r30, lime hover inversion |
| IV | SAT | `#f9f9f9` | `#0f0f0f` | grey `#a0a0a0`; colour only in imagery (tomato `#FF6347`) | Archivo, one size 13px | plus-cursor, draggable specimen strip |
| V | ATTCU | warm paper `#F6F1E7` | near-black | IKB `#002FA7`, fluoro pink | Young Serif / Newsreader | riso misregistration on hover, impression counter |

Section order = quietest to loudest register (practice, ideas, tools, studio, press),
ending vivid before the return to the void for the coda.

Each section holds: brand wordmark set in its own face; a one-line true description
(from the brand docs, CG voice); a specimen (real screenshot of the live site, framed
like a fabric swatch with mono notation); the thread restyled; a link out.

## Copy rules (CG voice, HARD)

First person, warm, intellectually serious, register whiplash welcome. British
English. NO em dashes, NO exclamation marks, NO emoji, no listicle cadence, no
"X isn't A. It's B.", no LLM vocabulary, no selling tone anywhere (the funnel is
invisible; prices never appear on this surface), no triumph arc.

## Structure

```
[ HERO 100vh ]      void; 6 threads weave in 3D; CIARA GRIFFIN huge in Fraunces;
                    kicker mono: THINKS · BUILDS · RENDERS · WRITES; thesis whisper
[ MANIFESTO ]       ~60vh, 52ch measure, cream on ink; thread runs the left margin
[ I   RETINUE ]     full register shift
[ II  EN ]          full register shift
[ III WCT ]         full register shift
[ IV  SAT ]         full register shift
[ V   ATTCU ]       full register shift
[ CODA ]            return to void; braid resolves into the thesis line
[ CONTACT/FOOT ]    name, Barcelona / Lisbon / Remote, LinkedIn, the six surfaces
```

## Motion discipline (lessons from the WCT/SAT/ATTCU builds)

- No pinned slow-burn text scenes. The page always moves when the reader moves.
- Scroll-scrub only where it resolves INTO something (thread draw; coda braid).
- Motion is conceptual and earned, never decoration; anything that reads as an
  app demo dies.
- Reduced motion: every scene has a complete static composition.
- Test the final frame at SHORT viewports (~650px), not just 900px.
- Capability-gate pointer effects (hover/pointer media queries), never touch-sniff.

## Build log, 10/07/2026

- Recon: all five live sites captured by headless Chrome (palettes, faces, idioms
  extracted); screenshots became the specimen images.
- Pass 1: full multi-viewport screenshot sweep (1440/1280x660/390). Fixes: thread
  rendering softened away from neon, mobile kicker, spine geometry (deep manifesto
  entry, smooth bulge runs, selvedge label clearance).
- Pass 2: per-brand idiom deepening (viewfinder corners + floating labels, EN caps
  line, SAT (R) + ( DRAG ), crop marks, WCT pill), basting-stitch seams, scripted
  interaction tests (drag, hovers, riso jitter, network wake), reduced-motion and
  no-JS verification, thread dive on scroll.
- Pass 3: independent adversarial review, 23 findings. All P0/P1 fixed (last-element
  reveal, shuttle persistence, nav/spine collisions via register-ground chip and
  own-layer blend, SAT strip keyboard + no-JS reach, AA contrast) and most P2
  (dye gradients at every seam, fonts.ready rebuild, DPR trail, ffi ligature
  clusters, ARIA, copy unification, dead code and font pruning).

## Tech

- Pure static: one `index.html`, vanilla JS + vendored `three.module.min.js` (r180).
- ZERO external requests at runtime (fonts self-hosted, all assets local).
- No build step. Repo = deployable artifact, like the-retinue-site.
- Quality floor: semantic headings, alt text, visible focus, AA contrast per register,
  responsive to 360px.
