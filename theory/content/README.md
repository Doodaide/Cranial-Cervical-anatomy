# Editing the theory pages

The pages in `theory/*.html` are generated. **Do not edit them.** Edit the text files in this folder instead, and the pages are rebuilt from them.

## The quick way: edit on GitHub

1. On github.com open `theory/content/skull.md` (or any region file) and click the pencil icon.
2. Change the text and commit the change to `main`.
3. A GitHub Action (`.github/workflows/build-theory.yml`) rebuilds the pages in about a minute and commits them. If you made a mistake in the format, the run shows a red cross under the Actions tab, and its log says which line to fix. Nothing broken is published.

## The local way

Edit the `.md` file in any text editor, then from the repository folder run:

```
pip install markdown          (once)
python3 tools/build_theory.py
```

Commit the changed `.md` file and the regenerated `theory/*.html` together. `python3 tools/build_theory.py --check` validates without writing.

## Starting a new region

- `python3 tools/build_theory.py --new thorax` writes `thorax.md` as a draft, with a heading for every topic in that region's table of contents. A draft is checked but not published. Delete the line `status: draft` when you want it live.
- Or copy `_TEMPLATE.md`, which shows every kind of block with notes. Files starting with `_` are ignored by the build.

## Putting your own notes in

Paste your notes under a heading and finish each block with a sources line. For your own knowledge use:

```
Sources: own
```

It appears on the page as "Author's notes", so a reader can tell it apart from the textbooks. You can combine them: `Sources: cunn ch. 2, p. 7; own`. Use a `:::dental` box for dental points, and a `:::clinical` box for clinical ones.

If you would rather not format anything, paste plain notes to Claude and ask for them to be set into the page format.

## The format

```
---
slug: skull
summary: One or two sentences shown under the title and on the Theory index.
---

## Section title {#section-id covers="skull.o5 skull.s6.1~"}

Text, in your own words. Bullet lists, numbered lists and tables work as normal Markdown.

Sources: cunn ch. 2, pp. 5–6; last Ch. 6, Part 19 (A typical cervical vertebra)

### Sub-section
```

- `##` starts a section and `###` a sub-section. Both appear in the contents list and get their own link.
- `{#id}` sets the link anchor (otherwise it is made from the title). Once pages are published, keep ids unchanged so links keep working.
- `covers="..."` lists the table-of-contents topics the section explains (ids from `python3 tools/build_theory.py --ids`). A trailing `~` marks partial cover. A heading only counts once it has text under it.
- Every section or sub-section with text needs at least one `Sources:` line. The build refuses to publish without it.
- Cunningham is cited by page (`p. 7`, `pp. 5–8`); the build checks the page is inside the pages that were supplied. Last's is cited by chapter, part and heading.
- Write explanations in your own words. Do not paste textbook sentences.

## Blocks

```
:::clinical Title {covers="tmj.c3"}     red box: clinical relevance
:::dental Title                         green box: dental relevance
:::keypoint Title                       blue box: short summary
:::note Title                           grey box: where sources differ, caveats
```

Each block ends with `:::`. Clinical and dental boxes need their own `Sources:` line inside. A diagram link is one line: Found in names found in `atlas.js`

```
::diagram cervical-vertebrae on=bones,bone-labels | Caption (diagram and layer ids come from data/atlas.js)
```

## Folding and search

Each `##` and `###` heading becomes a fold automatically; nothing needs adding to the notes. Every page gets its own search bar, and everything you write is added to the site-wide search the next time the build runs (locally, or through the GitHub Action after you save on github.com).

## Files in this folder

| File | What it is |
| --- | --- |
| `<region>.md` | the notes for one region |
| `objectives.txt` | the table of contents for each region (aims, structures, clinical topics) that the notes are measured against |
| `sources.json` | the books that can be cited, and `own` |
| `_TEMPLATE.md` | a blank page showing every block |
| `drafts/` | material kept for later (draft examination questions); ignored by the build |
