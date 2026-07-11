# Ciara Griffin — The Loom

The master personal-brand site: the room where five ventures meet the person who
makes them.

The hero threads are made of language: flowing lines of poetry and code in
her brand colours (WCT lime and magenta leading), with waves of magnification
travelling along them so you can read what each is spun from, and cursor
repulsion that bends the thread and swells its letters. A single vertical
thread of stacked letters and numbers then travels the whole page on scroll, passing through five sections that
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

Pure static. Vanilla JS, 2D canvas (no frameworks), self-hosted fonts
(MADE Future X display, Space Grotesk body, JetBrains Mono code, plus each
brand's own face for its wordmark). Zero external requests at runtime. No build
step; the repo is the deployable artifact.

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
