# Ciara Griffin — The Loom

The master personal-brand site: the room where five ventures meet the person who
makes them.

Six threads weave through the name in a WebGL void (the wordmark is a plane
inside the scene, so thread passes over and under the letterforms); a single
unbroken thread then travels the whole page, passing through five sections that
each shift the entire register into one of the real brands (And Then They Create
Us, Sometimes Aesthetic, Epistemic Net, The Retinue, We Create Tools), through
the pattern book, before all six threads braid together at the selvedge and
resolve into the thesis line.

Everything is code-drawn. The only photographs are real screenshots of the five
live sites, framed as specimens.

- Live: https://ciarasclaws.github.io/ciara-griffin-site/ (GitHub Pages from `main`)
- Pages: `/` (the loom) · `/writing/` (the pattern book) · `/writing/<slug>/` (drafts) · `/about/`
- Concept, register table, motion discipline, copy rules: [DESIGN.md](DESIGN.md)

## Stack

Pure static. Vanilla JS, vendored `three.module.min.js` (r180), self-hosted
fonts (Fraunces, Fragment Mono, plus each brand's own face for its wordmark).
Zero external requests at runtime. No build step; the repo is the deployable
artifact.

## Serve

Any static server, e.g.

```
python3 -m http.server 8794
```

## New draft (blog post)

Copy `writing/the-loom/` to `writing/<new-slug>/`, edit the content, then add a
`.pb-row` entry to `writing/index.html` and to the pattern book section of the
home page (`index.html`, `#writing`). Dates are DD/MM/YYYY.

## Refreshing the site previews

The five specimens on the home page are real screenshots, not live embeds (the
brand sites block iframes). To bring them up to date after any of the sites
change:

```
npm install
npm run refresh-specimens
git add assets/specimens && git commit -m "Refresh specimens" && git push
```

## Domain

Currently served from GitHub Pages. When ciaragriffin.xyz goes live, update
`canonical`/`og:url`/`og:image` in all four HTML files and add the CNAME file.
