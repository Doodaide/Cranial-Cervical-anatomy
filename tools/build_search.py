#!/usr/bin/env python3
"""Builds data/search-index.js, the index behind the site-wide search.

    python3 tools/build_theory.py        (this module is called at the end of every build; running
                                          python3 tools/build_search.py does the same thing)

Run the build again after changing data/atlas.js or the Anki deck list, because those are indexed too.

What is indexed:
    theory pages     one entry per section and sub-section (read from the built theory/<region>.html)
    diagrams         the title and layer names of every diagram in data/atlas.js
    topics           table-of-contents topics that have no notes yet, so a search still says they exist
    Anki decks       the deck titles on the Anki page
"""
import json
import os
import re
import sys
from html.parser import HTMLParser

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from atlas_data import ROOT, load_atlas  # noqa: E402

OUT = os.path.join(ROOT, "data", "search-index.js")

SKIP_CLASSES = {"t-anchor", "src", "t-refs", "t-obj", "t-banner", "t-pn-wrap", "t-find", "t-toc", "visually-hidden"}
INLINE = {"a", "em", "strong", "b", "i", "span", "mark", "sub", "sup", "abbr"}
LIST_TITLES = {"objectives": "Aims", "structures": "Regions and structures", "clinical": "Clinical relevance"}


def squash(s):
    return re.sub(r"\s+", " ", s).strip()


class RegionPage(HTMLParser):
    """Splits a built region page into one entry per heading."""

    def __init__(self):
        HTMLParser.__init__(self, convert_charrefs=True)
        self.title = ""
        self.entries = []  # [anchor, heading, text parts]
        self.cur = None
        self.in_h1 = False
        self.in_head = False  # collecting a heading's own text
        self.section_id = None
        self.sub_id = None
        self.skip_tag = None
        self.skip_depth = 0
        self.summary = False
        self.parts = []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        cls = set((a.get("class") or "").split())
        if self.skip_depth:
            if tag == self.skip_tag:
                self.skip_depth += 1
            return
        if tag in ("script", "style") or cls & SKIP_CLASSES:
            self.skip_tag, self.skip_depth = tag, 1
            return
        if tag == "h1":
            self.in_h1 = True
            return
        if "t-head__summary" in cls:
            self.summary = True
            self.parts = []
        if tag == "section" and "t-sec" in cls:
            self.section_id = a.get("id")
        if tag == "details" and "t-fold--sub" in cls:
            self.sub_id = a.get("id")
        if tag == "h2":
            self.cur = [self.section_id, "", []]
            self.entries.append(self.cur)
            self.in_head = True
            return
        if tag == "h3":
            self.cur = [self.sub_id, "", []]
            self.entries.append(self.cur)
            self.in_head = True
            return
        if self.cur is not None and tag not in INLINE:
            self.cur[2].append(" ")

    def handle_endtag(self, tag):
        if self.skip_depth:
            if tag == self.skip_tag:
                self.skip_depth -= 1
            return
        if tag == "h1":
            self.in_h1 = False
        elif tag in ("h2", "h3"):
            self.in_head = False
        elif self.summary and tag == "p":
            self.summary = False
        if self.cur is not None and tag not in INLINE:
            self.cur[2].append(" ")

    def handle_data(self, data):
        if self.skip_depth:
            return
        if self.in_h1:
            self.title += data
        elif self.summary:
            self.parts.append(data)
        elif self.in_head:
            self.cur[1] += data
        elif self.cur is not None:
            self.cur[2].append(data)


def theory_entries(theory_dir):
    out = []
    for fn in sorted(os.listdir(theory_dir)):
        if not fn.endswith(".html") or fn in ("index.html", "contents.html"):
            continue
        text = open(os.path.join(theory_dir, fn), encoding="utf-8").read()
        if 't-fold' not in text:
            continue
        p = RegionPage()
        p.feed(text)
        page = squash(p.title)
        url = "theory/" + fn
        intro = squash("".join(p.parts))
        if intro:
            out.append({"k": "Theory", "p": page, "t": page, "u": url, "x": intro})
        for anchor, head, parts in p.entries:
            body = squash("".join(parts))
            head = squash(head)
            if not head:
                continue
            out.append({"k": "Theory", "p": page, "t": head, "u": url + ("#" + anchor if anchor else ""), "x": body})
    return out


def diagram_entries(atlas):
    out = []
    for s in atlas["sets"]:
        names = ", ".join(l["name"] for l in s["layers"])
        out.append({"k": "Diagram", "p": "Diagrams", "t": s["title"], "u": "viewer.html?set=" + s["id"], "x": "Layers: " + names})
    return out


def anki_entries(path):
    out = []
    if not os.path.exists(path):
        return out
    text = open(path, encoding="utf-8").read()
    for m in re.finditer(r"<h4>(.*?)</h4>", text, re.S):
        title = squash(re.sub(r"<[^>]+>", "", m.group(1)))
        out.append({"k": "Anki", "p": "Anki decks", "t": title, "u": "anki_stuff/anki_decks.html", "x": "Anki flashcard deck to download"})
    return out


def topic_entries(regions):
    """Topics with no notes yet, so a search can still say they are part of the course."""
    out = []

    def walk(items, trail, region, label):
        for it in items:
            here = trail + [it.text.replace("::", ":").strip()]
            if it.children:
                walk(it.children, here, region, label)
            elif it.status == "none":
                title = ": ".join(here).replace("::", ":")
                out.append({
                    "k": "Topic",
                    "p": "Table of contents: " + region.title,
                    "t": title,
                    "u": "theory/contents.html#" + it.id,
                    "x": label + ". Not written yet.",
                })

    for r in regions:
        for key in ("objectives", "structures", "clinical"):
            walk(r.lists[key], [], r, LIST_TITLES[key])
    return out


def build(regions=None):
    entries = theory_entries(os.path.join(ROOT, "theory"))
    entries += diagram_entries(load_atlas())
    entries += anki_entries(os.path.join(ROOT, "anki_stuff", "anki_decks.html"))
    if regions is not None:
        entries += topic_entries(regions)
    data = {"v": 1, "e": entries}
    with open(OUT, "w", encoding="utf-8") as fh:
        fh.write("/* Generated by tools/build_search.py. Do not edit. */\n")
        fh.write("window.SEARCH_INDEX = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n")
    return len(entries), os.path.getsize(OUT)


if __name__ == "__main__":
    # The topic entries need the table of contents and its coverage, so the full build does the work.
    import build_theory

    sys.exit(build_theory.main())
