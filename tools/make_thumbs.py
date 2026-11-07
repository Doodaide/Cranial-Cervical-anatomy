#!/usr/bin/env python3
"""Build the atlas index thumbnails (assets/thumbs/) and data/generated.js.

Thumbnails: each one is the diagram as it first opens (the layers marked "on": true), cropped to
the drawing and fitted into a 4:3 frame.

data/generated.js holds two things the viewer needs:
  ATLAS_INK     the small colour dot beside each layer name. It is the colour of the filled
                structure on the layer (red arteries, blue veins, yellow nerves...). Layers drawn
                only in graphite pencil get a ring instead of a colour.
  ATLAS_BOUNDS  the box around each layer's drawing, so the viewer's "fit" button can frame the
                layers that are showing instead of the whole (mostly empty) canvas.

The home page hero (atlas.js "hero") is also written here: each step's layer is cropped to one shared
box and saved as a transparent WebP in assets/hero/, so the home page does not load the full-size PNGs.

Re-run after changing which layers start switched on, or after redrawing a layer:
    python3 tools/make_thumbs.py        (needs: pip install pillow)
"""
import json
import os

from PIL import Image, ImageChops, ImageFilter, ImageStat

from atlas_data import ROOT, load_atlas

W, H = 720, 540          # thumbnail size (4:3)
PAD = 0.04               # breathing room around the drawing in a thumbnail

out_dir = os.path.join(ROOT, "assets", "thumbs")
os.makedirs(out_dir, exist_ok=True)
hero_dir = os.path.join(ROOT, "assets", "hero")
HERO_W = 960             # hero layer width in pixels (the plate is shown at about 480 CSS px)


def ink_colour(im):
    """Colour of the filled structure on a layer; None if the layer is basically pencil.

    Thin label lines (often in another colour) are removed by eroding the coloured area, so the
    artery / muscle / nerve itself decides the colour. Hues are grouped into 12 bins and the most
    populated bin wins.
    """
    small = im.resize((im.width // 2, im.height // 2), Image.BOX)
    h, sat, val = small.convert("RGB").convert("HSV").split()
    coloured = ImageChops.multiply(sat.point(lambda x: 255 if x > 90 else 0), val.point(lambda x: 255 if x > 70 else 0))
    coloured = ImageChops.multiply(coloured, small.getchannel("A").point(lambda x: 255 if x >= 128 else 0))
    mask = None
    for size in (5, 3):
        eroded = coloured.filter(ImageFilter.MinFilter(size))
        if eroded.histogram()[255] >= 40:
            mask = eroded
            break
    if mask is None:
        return None
    hist = h.histogram(mask)
    bins = [0] * 12
    for hue, count in enumerate(hist):
        bins[((hue + 11) % 256) * 12 // 256] += count
    best = max(range(12), key=lambda k: bins[k])
    in_bin = h.point(lambda x: 255 if ((x + 11) % 256) * 12 // 256 == best else 0)
    mean = ImageStat.Stat(small.convert("RGB"), mask=ImageChops.multiply(mask, in_bin)).mean
    return "#%02x%02x%02x" % tuple(int(round(c)) for c in mean)


def merge(a, b):
    """Union of two (left, top, right, bottom) boxes; either may be None."""
    if a is None:
        return b
    if b is None:
        return a
    return (min(a[0], b[0]), min(a[1], b[1]), max(a[2], b[2]), max(a[3], b[3]))


def build_hero(atlas, bounds):
    """Crop the hero layers to one shared box and save them as transparent WebP files.

    Returns {"aspect": [w, h], "layers": {layer id: "assets/hero/<id>.webp"}} for generated.js.
    """
    hero = atlas.get("hero")
    if not hero:
        return None
    s = next(x for x in atlas["sets"] if x["id"] == hero["set"])
    layer_by_id = {l["id"]: l for l in s["layers"]}
    ids = [st["layer"] for st in hero["steps"]]
    box = None
    for i in ids:
        box = merge(box, tuple(bounds[s["id"]][i]))
    w, h = s["size"]
    pad = int(max(box[2] - box[0], box[3] - box[1]) * 0.03)
    box = (max(0, box[0] - pad), max(0, box[1] - pad), min(w, box[2] + pad), min(h, box[3] + pad))
    out_h = round(HERO_W * (box[3] - box[1]) / (box[2] - box[0]))
    os.makedirs(hero_dir, exist_ok=True)
    for f in os.listdir(hero_dir):
        os.remove(os.path.join(hero_dir, f))
    files = {}
    total = 0
    for i in ids:
        im = Image.open(os.path.join(ROOT, s["dir"], layer_by_id[i]["file"])).convert("RGBA").crop(box)
        im = im.resize((HERO_W, out_h), Image.LANCZOS)
        path = os.path.join(hero_dir, i + ".webp")
        im.save(path, "WEBP", quality=85, method=6)
        total += os.path.getsize(path)
        files[i] = "assets/hero/" + i + ".webp"
    print(f"hero: {len(ids)} layers, {HERO_W}x{out_h}, {total // 1024} KB")
    return {"aspect": [HERO_W, out_h], "layers": files}


ink = {}
bounds = {}

for s in load_atlas()["sets"]:
    w, h = s["size"]
    canvas = Image.new("RGBA", (w, h), (255, 255, 255, 255))
    on_box = None      # drawing box of the layers that start on (for the thumbnail)
    layer_boxes = {}   # drawing box of each layer (for the viewer's fit)

    for l in s["layers"]:
        im = Image.open(os.path.join(ROOT, s["dir"], l["file"])).convert("RGBA")
        alpha = im.getchannel("A")

        if not l.get("labelFor"):
            c = ink_colour(im)
            if c:
                ink[s["id"] + "/" + l["id"]] = c

        # a quarter-size alpha is plenty for a bounding box and much faster
        quarter = alpha.resize((w // 4, h // 4), Image.BOX).point(lambda v: 255 if v > 10 else 0).getbbox()
        if quarter:
            layer_boxes[l["id"]] = [quarter[0] * 4, quarter[1] * 4, quarter[2] * 4, quarter[3] * 4]

        if l.get("on"):
            canvas = Image.alpha_composite(canvas, im)
            on_box = merge(on_box, alpha.point(lambda v: 255 if v > 24 else 0).getbbox())

    bounds[s["id"]] = layer_boxes

    # ---- thumbnail
    bbox = on_box or (0, 0, w, h)
    px, py = int((bbox[2] - bbox[0]) * PAD), int((bbox[3] - bbox[1]) * PAD)
    box = (max(0, bbox[0] - px), max(0, bbox[1] - py), min(w, bbox[2] + px), min(h, bbox[3] + py))
    # grow the crop to the 4:3 frame so the drawing is centred rather than stretched
    cw, ch = box[2] - box[0], box[3] - box[1]
    if cw / ch < W / H:
        nw = int(ch * W / H)
        box = (box[0] - (nw - cw) // 2, box[1], box[0] - (nw - cw) // 2 + nw, box[3])
    else:
        nh = int(cw * H / W)
        box = (box[0], box[1] - (nh - ch) // 2, box[2], box[1] - (nh - ch) // 2 + nh)
    page = Image.new("RGB", (box[2] - box[0], box[3] - box[1]), (255, 255, 255))
    page.paste(canvas.convert("RGB").crop((max(0, box[0]), max(0, box[1]), min(w, box[2]), min(h, box[3]))),
               (max(0, -box[0]), max(0, -box[1])))
    page = page.resize((W, H), Image.LANCZOS)
    path = os.path.join(out_dir, s["id"] + ".webp")
    page.save(path, "WEBP", quality=82, method=6)
    print(f"{s['id']:26s} {os.path.getsize(path) // 1024:4d} KB")

atlas_all = load_atlas()
hero_info = build_hero(atlas_all, bounds)

with open(os.path.join(ROOT, "data", "generated.js"), "w", encoding="utf-8") as f:
    f.write("/* Generated by tools/make_thumbs.py. Do not edit by hand. */\n")
    f.write("window.ATLAS_INK = " + json.dumps(ink, indent=1, sort_keys=True) + ";\n")
    f.write("window.ATLAS_BOUNDS = " + json.dumps(bounds, separators=(",", ":"), sort_keys=True) + ";\n")
    f.write("window.ATLAS_HERO = " + json.dumps(hero_info, separators=(",", ":"), sort_keys=True) + ";\n")
print(f"\nink colours for {len(ink)} layers, drawing bounds for {sum(len(v) for v in bounds.values())} layers -> data/generated.js")
