# Cranial Cervical Anatomy

A hand-drawn atlas of head and neck anatomy by Alex He, built for anyone learning the region.
Every diagram is a stack of separate layers that can be switched on and off, with notes and Anki decks alongside.

Mistakes are possible. Some drawings are composites of Netter illustrations or tracings of images found online.
Corrections are welcome: business.alexander.he@gmail.com

## What is in the site

| Page | File |
| --- | --- |
| Home, diagram index, resources, about | `index.html` |
| Diagram viewer (all 16 diagrams) | `viewer.html?set=<id>` |
| Legacy lab doodles gallery | `legacy_lab.html` |
| Anki decks | `anki_stuff/anki_decks.html` |

The old per-diagram pages (`arteries.html`, `frontal_skull.html` and so on) still exist as small redirect pages,
so existing links and bookmarks keep working.

There is no build step. It is plain HTML, CSS and JavaScript that GitHub Pages serves as it is.
It uses classic scripts, not ES modules, so it also works when opened straight from disk.

## Folders

```
index.html, viewer.html, legacy_lab.html   pages
assets/css/                                site.css (design system), home.css, viewer.css, gallery.css
assets/js/                                 shell.js (header, footer, theme), home.js, viewer.js, gallery.js
assets/fonts/                              Newsreader and Instrument Sans (SIL Open Font Licence, licences included)
assets/thumbs/, assets/hero/               generated images (see Tools)
data/atlas.js                              the list of diagrams and layers: edit this
data/generated.js                          generated colours and bounds: do not edit
data/legacy.js                             captions for the legacy lab gallery
images/                                    the drawings (layer PNGs, notes PDF)
anki_stuff/                                the .apkg decks
tools/                                     Python helpers (see Tools)
theory_pages/                              unfinished, not linked from the site
```

## Adding or changing a diagram

Everything the viewer shows comes from `data/atlas.js`. There is no per-diagram page to write.

1. Put the layer PNGs in a folder under `images/`. Every layer in one diagram must be the same pixel size.
   Each is a transparent drawing, and the layers are stacked on top of each other.
2. Add an entry to `sets` in `data/atlas.js`. The comment at the top of the file explains every field.
   The order of `layers` is the stacking order: the first layer is at the bottom.
   A layer that holds only labels gets `"labelFor": "<layer id>"`, and is switched from the `Aa` button on that layer's row.
3. Run the checks and the generators (below).
4. The diagram appears on the home page and opens at `viewer.html?set=<id>`.

Keep `data/atlas.js` valid JSON after the opening `window.ATLAS =`, because the Python tools read it.

## Tools

Run these from the repository root. `pip install pillow` is needed for the last two.

```
python3 tools/check_atlas.py      checks every layer file exists (case-sensitive, as on GitHub Pages), sizes match, ids are unique
python3 tools/make_thumbs.py      rebuilds assets/thumbs/, assets/hero/ and data/generated.js
python3 tools/make_redirects.py   rewrites the redirect pages for the old addresses
```

Run `check_atlas.py` after every edit of `data/atlas.js`. It catches filename typos, which fail silently in a browser.
Run `make_thumbs.py` after adding a diagram, changing which layers start switched on, or redrawing a layer.

## Previewing locally

```
python3 -m http.server 8000
```

Then open http://localhost:8000/.

## Credits

- Drawings and site: Alex He
- PDF notes: Sumen A
- Many diagrams are inspired by drawings by Frank Netter
- Fonts: Newsreader and Instrument Sans, by their project authors, under the SIL Open Font Licence (licence files in `assets/fonts/`)
