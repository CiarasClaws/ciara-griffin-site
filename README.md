# Ciara Griffin — The Loom

The master personal-brand site: the room where five ventures meet the person who
makes them.

One page. Six threads weave in a WebGL void behind the name; a single unbroken
thread then travels the whole page, passing through five sections that each shift
the entire register into one of the real brands (The Retinue, Epistemic Net,
We Create Tools, Sometimes Aesthetic, And Then They Create Us), before all six
braid together at the selvedge and resolve into the thesis line.

Everything is code-drawn. The only photographs are real screenshots of the five
live sites, framed as specimens.

## Stack

Pure static. One `index.html`, vanilla JS, vendored `three.module.min.js` (r180),
self-hosted fonts (Fraunces, Fragment Mono, plus each brand's own face for its
wordmark). Zero external requests at runtime. No build step; the repo is the
deployable artifact.

## Serve

Any static server, e.g.

```
python3 -m http.server 8794
```

## Design notes

See `DESIGN.md` for the full design document: concept, register table, motion
discipline, and copy rules.
