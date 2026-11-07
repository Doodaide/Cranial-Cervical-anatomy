#!/usr/bin/env python3
"""Write the small redirect pages that keep the old page addresses working.

Before the redesign every diagram had its own page (arteries.html, frontal_skull.html ...). Links and
bookmarks to those still land somewhere useful: each old file is now a stub that forwards to
viewer.html?set=<id>. The old names come from the "legacy" field of each diagram in data/atlas.js.

Run again after adding a "legacy" name to a diagram:   python3 tools/make_redirects.py
"""
import html
import os

from atlas_data import ROOT, load_atlas

# old pages that now live on the home page
EXTRA = {
    "gene.html": ("index.html#resources", "Resources"),
    "useful_links.html": ("index.html#resources", "Resources"),
}

TEMPLATE = """<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>This page has moved | Cranial Cervical Anatomy</title>
  <meta name="robots" content="noindex">
  <meta http-equiv="refresh" content="0; url={url}">
  <link rel="canonical" href="{url}">
  <script>location.replace("{url}");</script>
  <style>body{{margin:0;padding:32px 24px;font:16px/1.5 system-ui,sans-serif;color:#0a2230}}a{{color:#094260}}</style>
</head>
<body>
  <p>This page has moved to <a href="{url}">{name}</a>.</p>
</body>
</html>
"""


def write(filename, url, name):
    with open(os.path.join(ROOT, filename), "w", encoding="utf-8") as f:
        f.write(TEMPLATE.format(url=html.escape(url, quote=True), name=html.escape(name)))
    print(f"{filename:32s} -> {url}")


for s in load_atlas()["sets"]:
    if s.get("legacy"):
        write(s["legacy"], "viewer.html?set=" + s["id"], s["title"])
for filename, (url, name) in EXTRA.items():
    write(filename, url, name)
