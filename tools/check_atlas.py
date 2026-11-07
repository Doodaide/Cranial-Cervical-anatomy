#!/usr/bin/env python3
"""Check data/atlas.js against the files on disk.

Run from anywhere:  python3 tools/check_atlas.py
Needs Pillow for the size check:  pip install pillow

It reports, for every diagram:
  - layer files that do not exist (exact, case-sensitive match, as on GitHub Pages)
  - layers whose pixel size differs from the set's declared size
  - duplicate layer ids, groups that are not declared, labelFor targets that do not exist
  - PNG files in the diagram's folder that no layer uses
  - the home page 'hero' steps pointing at layers that do not exist
Exit status is 1 if anything is wrong, so it can also run in CI.
"""
import os, sys
from atlas_data import ROOT, load_atlas

try:
    from PIL import Image
except ImportError:
    Image = None
    print("note: Pillow not installed, skipping pixel-size checks")

atlas = load_atlas()
problems = []
used_dirs = {}

for s in atlas["sets"]:
    sid = s["id"]
    ids = [l["id"] for l in s["layers"]]
    for dup in {i for i in ids if ids.count(i) > 1}:
        problems.append(f"{sid}: duplicate layer id '{dup}'")
    declared = set(s["groups"])
    for l in s["layers"]:
        path = os.path.join(ROOT, s["dir"], l["file"])
        where = f"{sid}/{l['id']}"
        if not os.path.isfile(path):
            problems.append(f"{where}: file not found: {s['dir']}/{l['file']}")
            continue
        if Image:
            with Image.open(path) as im:
                if list(im.size) != s["size"]:
                    problems.append(f"{where}: is {im.size[0]}x{im.size[1]}, set size is {s['size'][0]}x{s['size'][1]}")
        if l.get("labelFor"):
            if l["labelFor"] not in ids:
                problems.append(f"{where}: labelFor '{l['labelFor']}' is not a layer in this set")
        elif l.get("group") not in declared:
            problems.append(f"{where}: group '{l.get('group')}' is not in the set's groups list")
    used_dirs.setdefault(s["dir"], set()).update(l["file"] for l in s["layers"])

for d, files in used_dirs.items():
    folder = os.path.join(ROOT, d)
    for f in sorted(os.listdir(folder)):
        if f.lower().endswith(".png") and f not in files:
            problems.append(f"{d}/{f}: PNG not used by any layer (ignore if intentional)")

hero = atlas.get("hero")
if hero:
    hs = next((s for s in atlas["sets"] if s["id"] == hero["set"]), None)
    if hs is None:
        problems.append(f"hero: set '{hero['set']}' does not exist")
    else:
        hs_ids = {l["id"] for l in hs["layers"]}
        for step in hero["steps"]:
            if step["layer"] not in hs_ids:
                problems.append(f"hero: layer '{step['layer']}' is not in set '{hero['set']}'")

n_layers = sum(len(s["layers"]) for s in atlas["sets"])
print(f"{len(atlas['sets'])} diagrams, {n_layers} layers checked")
if problems:
    print(f"\n{len(problems)} problem(s):")
    for p in problems:
        print("  -", p)
    sys.exit(1)
print("all good")
