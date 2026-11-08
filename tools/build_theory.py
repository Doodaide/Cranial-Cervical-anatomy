#!/usr/bin/env python3
"""Builds the theory pages from Markdown into plain HTML.

    python3 tools/build_theory.py            build theory/index.html, theory/<region>.html, theory/contents.html
    python3 tools/build_theory.py --check    validate everything, write nothing
    python3 tools/build_theory.py --new thorax   start a draft file for a region, with a heading for every topic
    python3 tools/build_theory.py --ids      print every table-of-contents id with its coverage, then exit

Inputs (all in theory/content/):
    objectives.txt    the department's regional objectives; the checklist the notes are measured against
    sources.json      the textbooks that may be cited
    <region>.md       the notes for one region (the file name is the region's slug from objectives.txt)

The format of a region file is described in theory/content/README.md.
Needs:  pip install markdown
"""
import html
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from atlas_data import ROOT, load_atlas  # noqa: E402

try:
    import markdown
except ImportError:
    sys.exit("This needs the Markdown package:  pip install markdown")

CONTENT = os.path.join(ROOT, "theory", "content")
OUT = os.path.join(ROOT, "theory")

LIST_KEYS = {"objectives": "o", "structures": "s", "clinical": "c"}
LIST_TITLES = {
    "objectives": "Aims",
    "structures": "Regions and structures",
    "clinical": "Clinical relevance",
}

errors = []


def err(where, msg):
    errors.append("%s: %s" % (where, msg))


def esc(s):
    return html.escape(s, quote=True)


def typo(s):
    """Typographic apostrophes for text that does not go through Markdown."""
    return s.replace("'", "’")


def slugify(s):
    s = re.sub(r"<[^>]+>", "", s).lower().replace("'", "").replace("’", "")
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")


# ---------------------------------------------------------------- objectives

class Item:
    def __init__(self, id_, text, note):
        self.id = id_
        self.text = text
        self.note = note
        self.children = []
        self.status = "none"  # none | partial | full
        self.sections = []  # [(slug, anchor, title)] that cover this item


class Region:
    def __init__(self, slug, number, title):
        self.slug = slug
        self.number = number
        self.title = title
        self.lists = {k: [] for k in LIST_KEYS}
        self.meta = None  # front matter of its notes file, if there is one


def load_objectives():
    path = os.path.join(CONTENT, "objectives.txt")
    regions = []
    region = None
    key = None
    counter = 0
    stack = []  # [(depth, Item)]
    for ln, raw in enumerate(open(path, encoding="utf-8"), 1):
        line = raw.rstrip("\n")
        where = "objectives.txt:%d" % ln
        m = re.match(r"^# ([a-z0-9]+) \| (\d+) \| (.+)$", line)
        if m:
            region = Region(m.group(1), int(m.group(2)), m.group(3).strip())
            regions.append(region)
            key = None
            continue
        m = re.match(r"^## (objectives|structures|clinical)$", line)
        if m:
            if region is None:
                err(where, "list before any region")
                continue
            key = m.group(1)
            counter = 0
            stack = []
            continue
        m = re.match(r"^( *)- (.+)$", line)
        if m:
            if region is None or key is None:
                err(where, "item outside a list")
                continue
            indent = len(m.group(1))
            if indent % 2:
                err(where, "indent must be a multiple of two spaces")
                continue
            depth = indent // 2
            text, _, note = m.group(2).partition(" || ")
            if depth == 0:
                counter += 1
                item = Item("%s.%s%d" % (region.slug, LIST_KEYS[key], counter), text.strip(), note.strip())
                region.lists[key].append(item)
                stack = [(0, item)]
            else:
                while stack and stack[-1][0] >= depth:
                    stack.pop()
                if not stack or stack[-1][0] != depth - 1:
                    err(where, "sub-item has no parent")
                    continue
                parent = stack[-1][1]
                item = Item("%s.%d" % (parent.id, len(parent.children) + 1), text.strip(), note.strip())
                parent.children.append(item)
                stack.append((depth, item))
    return regions


def walk(items):
    for it in items:
        yield it
        for c in walk(it.children):
            yield c


def all_items(regions):
    out = {}
    for r in regions:
        for k in LIST_KEYS:
            for it in walk(r.lists[k]):
                out[it.id] = it
    return out


def leaves(items):
    return [it for it in walk(items) if not it.children]


# ------------------------------------------------------------------- sources

def load_sources():
    data = json.load(open(os.path.join(CONTENT, "sources.json"), encoding="utf-8"))
    return {k: v for k, v in data.items() if not k.startswith("_")}


def parse_sources(text, where, sources, used):
    """'cunn ch. 2, pp. 5-8; last Ch. 6, Part 18' -> [(key, locator)]"""
    out = []
    for part in text.split(";"):
        part = part.strip()
        if not part:
            continue
        key, _, loc = part.partition(" ")
        loc = loc.strip()
        if key not in sources:
            err(where, "unknown source '%s' (known: %s)" % (key, ", ".join(sources)))
            continue
        if not loc and not sources[key].get("noLocator"):
            err(where, "source '%s' needs a locator (page, or chapter, part and heading)" % key)
            continue
        rng = sources[key].get("pages")
        if rng:
            m = re.search(r"\bpp?\.\s*([\d–\-, ]+)", loc)
            if not m:
                err(where, "%s locators must give a page: 'p. 7' or 'pp. 5–8' (got '%s')" % (key, loc))
            else:
                for n in re.findall(r"\d+", m.group(1)):
                    if not rng[0] <= int(n) <= rng[1]:
                        err(where, "page %s is outside the pages supplied (%d–%d)" % (n, rng[0], rng[1]))
        used.add(key)
        out.append((key, loc))
    return out


def render_src(pairs, sources):
    if not pairs:
        return ""
    parts = []
    for key, loc in pairs:
        if loc:
            parts.append("%s, %s" % (esc(sources[key]["short"]), esc(typo(loc))))
        else:
            parts.append(esc(sources[key]["short"]))
    return '<p class="src"><span class="src__label">Sources</span> %s</p>' % "; ".join(parts)


# ------------------------------------------------------------------ markdown

def md(text):
    m = markdown.Markdown(extensions=["tables", "sane_lists", "smarty"], output_format="html")
    out = m.convert(text)
    out = out.replace("<table>", '<div class="t-table"><table>').replace("</table>", "</table></div>")
    return out


def md_inline(text):
    out = md(text).strip()
    m = re.match(r"^<p>(.*)</p>$", out, re.S)
    return m.group(1) if m and "<p>" not in m.group(1) else out


# ------------------------------------------------------------------- parsing

HEAD_RE = re.compile(r"^(#{2,3})\s+(.+?)\s*$")
ATTR_TAIL = re.compile(r"\s*\{([^{}]*)\}\s*$")
ATTR_TOK = re.compile(r'#([\w-]+)|([\w-]+)="([^"]*)"')


def split_attrs(text, where):
    """'Title {#id covers="a b"}' -> ('Title', {'id': 'id', 'covers': 'a b'})"""
    m = ATTR_TAIL.search(text)
    if not m:
        return text.strip(), {}
    inner = m.group(1)
    attrs = {}
    for t in ATTR_TOK.finditer(inner):
        if t.group(1):
            attrs["id"] = t.group(1)
        else:
            attrs[t.group(2)] = t.group(3)
    rest = ATTR_TOK.sub("", inner).strip()
    if rest:
        err(where, "cannot read '%s' in {...}" % rest)
    return text[: m.start()].strip(), attrs


def read_region_file(path, slug):
    text = open(path, encoding="utf-8").read()
    m = re.match(r"---\n(.*?)\n---\n", text, re.S)
    meta = {}
    body = text
    if m:
        for line in m.group(1).splitlines():
            k, _, v = line.partition(":")
            if k.strip():
                meta[k.strip()] = v.strip()
        body = text[m.end():]
        offset = text[: m.end()].count("\n")
    else:
        offset = 0
    return meta, body.split("\n"), offset


def segment(lines, offset, fname):
    nodes = []
    buf = []
    buf_start = [0]

    def flush():
        if re.sub(r"<!--.*?-->", "", "\n".join(buf), flags=re.S).strip():
            nodes.append(("md", "\n".join(buf), buf_start[0]))
        del buf[:]

    i = 0
    while i < len(lines):
        s = lines[i].rstrip()
        ln = i + 1 + offset
        where = "%s:%d" % (fname, ln)
        if s.startswith(":::") and len(s) > 3 and s[3] != ":":
            flush()
            head = s[3:].strip()
            name, _, rest = head.partition(" ")
            j = i + 1
            body = []
            while j < len(lines) and lines[j].rstrip() != ":::":
                body.append(lines[j].rstrip())
                j += 1
            if j >= len(lines):
                err(where, "block ':::%s' is never closed with ':::'" % name)
            nodes.append(("block", name, rest.strip(), body, ln))
            i = j + 1
            continue
        if s.startswith("::diagram"):
            flush()
            nodes.append(("diagram", s[len("::diagram"):].strip(), ln))
            i += 1
            continue
        if s.startswith("Sources:"):
            flush()
            nodes.append(("src", s[len("Sources:"):].strip(), ln))
            i += 1
            continue
        mh = HEAD_RE.match(s)
        if mh:
            flush()
            title, attrs = split_attrs(mh.group(2), where)
            nodes.append(("h", len(mh.group(1)), title, attrs, ln))
            i += 1
            continue
        if not buf:
            buf_start[0] = ln
        buf.append(lines[i])
        i += 1
    flush()
    return nodes


# -------------------------------------------------------------- region pages

class Cover:
    """One section (or box) that covers checklist items."""

    def __init__(self, slug, anchor, title, status):
        self.slug, self.anchor, self.title, self.status = slug, anchor, title, status


def parse_covers(attrs, where, known):
    out = []
    for tok in attrs.get("covers", "").split():
        status = "partial" if tok.endswith("~") else "full"
        iid = tok.rstrip("~")
        if iid not in known:
            err(where, "unknown checklist id '%s' (run: python3 tools/build_theory.py --ids)" % iid)
            continue
        out.append((iid, status))
    return out


def build_region_body(region, nodes, fname, sources, atlas, known, coverage):
    """Render one region's notes. Returns (sections_html, toc, used_source_keys)."""
    sets = {s["id"]: s for s in atlas["sets"]}
    out = []
    toc = []  # (level, id, title)
    ids = set()
    used = set()
    blocks = []  # validation: every heading block that has prose needs a Sources line
    cur = None
    open_sec = False
    parent = None

    def claim(where, iid):
        if iid in ids:
            err(where, "duplicate id '%s' on this page" % iid)
        ids.add(iid)

    def need_block(where):
        if cur is None:
            err(where, "content before the first '##' heading")
            return False
        return True

    for node in nodes:
        kind = node[0]
        if kind == "h":
            _, level, title, attrs, ln = node
            where = "%s:%d" % (fname, ln)
            hid = attrs.get("id") or slugify(title)
            claim(where, hid)
            clean = typo(title)
            cur = {"title": title, "where": where, "md": False, "src": False, "content": False, "covers": [], "parent": None}
            blocks.append(cur)
            if level == 2:
                parent = cur
            else:
                cur["parent"] = parent
            for iid, status in parse_covers(attrs, where, known):
                cur["covers"].append((iid, Cover(region.slug, hid, title, status)))
            toc.append((level, hid, clean))
            anchor = '<a class="t-anchor" href="#%s" aria-label="Link to this section">#</a>' % hid
            if level == 2:
                if open_sec:
                    out.append("</section>")
                out.append('<section class="t-sec" id="%s" aria-labelledby="%s-h">' % (hid, hid))
                out.append('<h2 id="%s-h">%s %s</h2>' % (hid, esc(clean), anchor))
                open_sec = True
            else:
                if not open_sec:
                    err(where, "'###' heading before any '##' heading")
                out.append('<h3 id="%s">%s %s</h3>' % (hid, esc(clean), anchor))
        elif kind == "md":
            _, text, ln = node
            if need_block("%s:%d" % (fname, ln)):
                cur["md"] = True
                cur["content"] = True
            out.append(md(text))
        elif kind == "src":
            _, text, ln = node
            where = "%s:%d" % (fname, ln)
            if need_block(where):
                cur["src"] = True
            out.append(render_src(parse_sources(text, where, sources, used), sources))
        elif kind == "diagram":
            _, text, ln = node
            where = "%s:%d" % (fname, ln)
            out.append(render_diagram(text, where, sets))
        elif kind == "block":
            _, name, rest, body, ln = node
            where = "%s:%d" % (fname, ln)
            if not need_block(where):
                continue
            title, attrs = split_attrs(rest, where)
            if name == "mcq":
                err(where, "self-test questions are not used on theory pages (they will live on the examination page)")
                continue
            if name not in ("clinical", "dental", "keypoint", "note"):
                err(where, "unknown block ':::%s' (use clinical, dental, keypoint or note)" % name)
                continue
            text_lines, srcs = [], []
            for b in body:
                if b.startswith("Sources:"):
                    srcs.extend(parse_sources(b[len("Sources:"):], where, sources, used))
                else:
                    text_lines.append(b)
            has_text = bool("".join(text_lines).strip())
            if srcs:
                cur["src"] = True
            if has_text:
                cur["content"] = True
            if has_text and name in ("clinical", "dental") and not srcs:
                err(where, "a %s box needs a 'Sources:' line inside it (use 'Sources: own' for your own knowledge)" % name)
            default = {"clinical": "Clinical relevance", "dental": "Dental relevance", "keypoint": "Key points", "note": "Note"}[name]
            bid = attrs.get("id")
            if not bid and title:
                bid = "%s-%s" % (name, slugify(title))
            attr_id = ""
            if bid:
                claim(where, bid)
                attr_id = ' id="%s"' % bid
            if attrs.get("covers"):
                if name not in ("clinical", "dental") or not bid:
                    err(where, "'covers' is allowed on headings and on titled clinical or dental boxes only")
                elif has_text:
                    for iid, status in parse_covers(attrs, where, known):
                        coverage.setdefault(iid, []).append(Cover(region.slug, bid, title, status))
            label = default if name in ("clinical", "dental") or not title else title
            out.append('<aside class="callout callout--%s"%s>' % (name, attr_id))
            out.append('<p class="callout__label">%s</p>' % esc(typo(label)))
            if name in ("clinical", "dental") and title:
                out.append('<p class="callout__title">%s</p>' % esc(typo(title)))
            out.append(md("\n".join(text_lines)))
            out.append(render_src(srcs, sources))
            out.append("</aside>")
    if open_sec:
        out.append("</section>")
    for b in blocks:
        if b["md"] and not b["src"]:
            err(b["where"], "section '%s' has text but no 'Sources:' line" % b["title"])
        if b["content"] and b["parent"]:
            b["parent"]["content"] = True
    # An item counts as covered only when its section has real text; empty skeleton headings count for nothing.
    for b in blocks:
        if b["content"]:
            for iid, cov in b["covers"]:
                coverage.setdefault(iid, []).append(cov)
    return "\n".join(out), toc, used


def render_diagram(text, where, sets):
    spec, _, caption = text.partition("|")
    toks = spec.split()
    if not toks:
        err(where, "::diagram needs a diagram id")
        return ""
    sid = toks[0]
    on = ""
    for t in toks[1:]:
        if t.startswith("on="):
            on = t[3:]
    s = sets.get(sid)
    if not s:
        err(where, "unknown diagram '%s'" % sid)
        return ""
    names = {l["id"]: l["name"] for l in s["layers"]}
    shown = []
    if on and on != "none":
        for lid in on.split(","):
            if lid not in names:
                err(where, "diagram '%s' has no layer '%s'" % (sid, lid))
            else:
                shown.append(names[lid])
    href = "../viewer.html?set=%s" % sid
    if on:
        href += "&on=%s" % on
    out = ['<a class="dcard" href="%s">' % esc(href)]
    out.append('<img src="../assets/thumbs/%s.webp" alt="" width="720" height="540" loading="lazy">' % sid)
    out.append('<span class="dcard__body"><span class="dcard__kicker">Open in the diagram viewer</span>')
    out.append("<strong>%s</strong>" % esc(typo(s["title"])))
    if caption.strip():
        out.append('<span class="dcard__cap">%s</span>' % esc(typo(caption.strip())))
    if shown:
        out.append('<span class="dcard__layers">Opens with: %s</span>' % esc(typo(", ".join(shown))))
    out.append("</span></a>")
    return "".join(out)


# ------------------------------------------------------------------ coverage

def apply_coverage(regions, coverage):
    def visit(item, inherited):
        own = coverage.get(item.id, [])
        full_own = any(c.status == "full" for c in own)
        inh = inherited or (own if full_own else None)
        item.sections = [(c.slug, c.anchor, c.title) for c in (own or [])]
        if not item.sections and inherited:
            item.sections = [(c.slug, c.anchor, c.title) for c in inherited]
        if item.children:
            for ch in item.children:
                visit(ch, inh)
            states = [ch.status for ch in item.children]
            if full_own or all(s == "full" for s in states):
                item.status = "full"
            elif own or any(s != "none" for s in states):
                item.status = "partial"
            else:
                item.status = "none"
        else:
            if inherited or full_own:
                item.status = "full"
            elif own:
                item.status = "partial"
            else:
                item.status = "none"

    for r in regions:
        for k in LIST_KEYS:
            for it in r.lists[k]:
                visit(it, None)


def region_counts(region):
    lv = [it for k in LIST_KEYS for it in leaves(region.lists[k])]
    full = sum(1 for it in lv if it.status == "full")
    part = sum(1 for it in lv if it.status == "partial")
    return len(lv), full, part


# ------------------------------------------------------------------ rendering

HEAD_TMPL = """<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{title}</title>
  <meta name="description" content="{desc}">
  <script src="../assets/js/theme-init.js"></script>
  <link rel="preload" href="../assets/fonts/newsreader-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="../assets/fonts/instrument-sans-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="../assets/css/site.css">
  <link rel="stylesheet" href="../assets/css/theory.css">
</head>
<body{body_attrs}>
  <script src="../assets/js/shell.js"></script>
"""

TAIL_TMPL = """
  <div id="site-footer"></div>
  <script src="../assets/js/theory.js" defer></script>
</body>
</html>
"""

BACK_ICON = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m15 6-6 6 6 6"/></svg>'


def page(title, desc, body, body_attrs=""):
    head = HEAD_TMPL.format(title=esc(title), desc=esc(desc), body_attrs=body_attrs)
    return head + body + TAIL_TMPL


def meter(full, part, total):
    if not total:
        return ""
    return (
        '<span class="t-meter" aria-hidden="true"><span class="t-meter__full" style="width:%.1f%%"></span>'
        '<span class="t-meter__part" style="width:%.1f%%"></span></span>'
        % (100.0 * full / total, 100.0 * part / total)
    )


def counts_line(full, part, total):
    s = "%d of %d topics covered" % (full, total)
    if part:
        s += ", %d partly" % part
    return s


STATUS_TAG = {"full": ("Covered", "t-tag--full"), "partial": ("Partly covered", "t-tag--part")}


def render_item(item, ticks):
    tag = ""
    if item.status in STATUS_TAG:
        label, cls = STATUS_TAG[item.status]
        tag = '<span class="t-tag %s">%s</span>' % (cls, label)
    links = ""
    if item.sections and item.status != "none":
        seen, anchors = set(), []
        for slug, anchor, title in item.sections:
            if (slug, anchor) in seen:
                continue
            seen.add((slug, anchor))
            anchors.append('<a href="%s.html#%s">%s</a>' % (slug, anchor, esc(typo(title))))
        links = '<span class="t-item__links">In the notes: %s</span>' % ", ".join(anchors)
    note = '<span class="t-item__note">%s</span>' % esc(typo(item.note)) if item.note else ""
    text = esc(typo(item.text))
    if ticks:
        head = (
            '<label class="t-item__label"><input type="checkbox" class="t-item__tick" data-id="%s">'
            '<span class="t-item__text">%s</span></label>' % (item.id, text)
        )
    else:
        head = '<span class="t-item__label"><span class="t-item__text">%s</span></span>' % text
    out = ['<li class="t-item" data-id="%s" data-status="%s">' % (item.id, item.status)]
    out.append('<div class="t-item__row">%s%s</div>' % (head, tag))
    if note or links:
        out.append('<div class="t-item__meta">%s%s</div>' % (note, links))
    if item.children:
        out.append('<ul class="t-list">%s</ul>' % "".join(render_item(c, ticks) for c in item.children))
    out.append("</li>")
    return "".join(out)


def build_contents_page(regions, sources):
    total = full = part = 0
    for r in regions:
        t, f, p = region_counts(r)
        total, full, part = total + t, full + f, part + p
    jump = []
    secs = []
    for r in regions:
        t, f, p = region_counts(r)
        jump.append('<li><a href="#%s"><span class="t-jump__n">%d</span> %s</a></li>' % (r.slug, r.number, esc(typo(r.title))))
        lists = []
        for k in LIST_KEYS:
            if not r.lists[k]:
                continue
            lists.append(
                '<div class="t-group"><h3>%s</h3><ul class="t-list t-list--top">%s</ul></div>'
                % (LIST_TITLES[k], "".join(render_item(it, True) for it in r.lists[k]))
            )
        link = ""
        if r.meta is not None:
            link = ' <a class="t-region-link" href="%s.html">Read the notes</a>' % r.slug
        secs.append(
            '<section class="t-region-sec" id="%s"><header class="t-region-sec__head"><h2><span class="t-jump__n">%d</span> %s</h2>'
            '<p class="t-region-sec__count">%s%s</p>%s</header>%s</section>'
            % (r.slug, r.number, esc(typo(r.title)), counts_line(f, p, t), link, meter(f, p, t), "".join(lists))
        )
    body = """
  <main id="main" class="container">
    <header class="page-head">
      <a class="page-head__back" href="index.html">%(back)s Theory</a>
      <h1>Table of contents</h1>
      <p>Every topic in the head and neck course, region by region. Each one shows whether these notes cover it yet, and links to where.</p>
      <p class="page-head__small">Tick items as you revise them. Ticks are saved in this browser only.</p>
    </header>
    <div class="t-toolbar" id="t-toolbar" hidden>
      <p class="t-toolbar__stat" id="t-progress" aria-live="polite"></p>
      <div class="t-toolbar__chips" role="group" aria-label="Show">
        <button class="chip" type="button" data-filter="all" aria-pressed="true">All</button>
        <button class="chip" type="button" data-filter="covered" aria-pressed="false">Covered in the notes</button>
        <button class="chip" type="button" data-filter="todo" aria-pressed="false">Not yet ticked</button>
      </div>
    </div>
    <p class="t-overall">%(overall)s across %(nr)d regions.</p>
    <nav class="t-jump" aria-label="Regions"><ul>%(jump)s</ul></nav>
    <div class="t-checklist" id="t-checklist">%(secs)s</div>
  </main>
""" % {
        "back": BACK_ICON,
        "overall": counts_line(full, part, total),
        "nr": len(regions),
        "jump": "".join(jump),
        "secs": "".join(secs),
    }
    return page(
        "Table of contents | Theory | Cranial Cervical Anatomy",
        "Every head and neck topic in the course, with the notes that cover it.",
        body,
        ' data-page="contents"',
    )


def refs_html(keys, sources):
    if not keys:
        return ""
    items = []
    for k in sorted(keys, key=lambda x: list(sources).index(x)):
        s = sources[k]
        extra = ""
        if s.get("confirm"):
            extra = ' <span class="t-refs__confirm">(edition, year and editors still to be confirmed)</span>'
        items.append("<li>%s%s <span class=\"t-refs__how\">%s</span></li>" % (esc(typo(s["ref"])), extra, esc(typo(s.get("how", "")))))
    return '<section class="t-refs" id="sources" aria-labelledby="sources-h"><h2 id="sources-h">Sources for this page</h2><ol>%s</ol></section>' % "".join(items)


def build_region_page(region, regions, body, toc, used, sources):
    t, f, p = region_counts(region)
    meta = region.meta
    # the contents list: sections, with their sub-sections nested
    toc_html = ['<li><a href="#aims">Aims</a></li>']
    i = 0
    n = len(toc)
    while i < n:
        level, hid, title = toc[i]
        if level != 2:
            i += 1
            continue
        subs = []
        j = i + 1
        while j < n and toc[j][0] == 3:
            subs.append(toc[j])
            j += 1
        li = '<li><a href="#%s">%s</a>' % (hid, esc(title))
        if subs:
            li += "<ol>%s</ol>" % "".join('<li><a href="#%s">%s</a></li>' % (h, esc(tt)) for _, h, tt in subs)
        toc_html.append(li + "</li>")
        i = j
    toc_html.append('<li><a href="#sources">Sources</a></li>')

    objs = region.lists["objectives"]
    obj_box = (
        '<details class="t-obj" id="aims"><summary>Aims for this region <span class="t-obj__n">%d</span></summary>'
        '<ul class="t-list t-list--top">%s</ul>'
        '<p class="t-obj__more"><a href="contents.html#%s">Table of contents for this region</a></p></details>'
        % (len(objs), "".join(render_item(it, False) for it in objs), region.slug)
    )
    banner = ""
    if f < t:
        banner = (
            '<p class="t-banner">These notes are being written in stages. The sections below are finished. '
            'The <a href="contents.html#%s">table of contents</a> shows what is still to come (%s).</p>' % (region.slug, counts_line(f, p, t))
        )
    written = [r for r in regions if r.meta is not None]
    idx = written.index(region)
    nav = []
    if idx > 0:
        pr = written[idx - 1]
        nav.append('<a class="t-pn t-pn--prev" href="%s.html"><span>Previous</span><strong>%s</strong></a>' % (pr.slug, esc(typo(pr.title))))
    if idx < len(written) - 1:
        nx = written[idx + 1]
        nav.append('<a class="t-pn t-pn--next" href="%s.html"><span>Next</span><strong>%s</strong></a>' % (nx.slug, esc(typo(nx.title))))
    prevnext = '<nav class="t-pn-wrap" aria-label="Other regions">%s</nav>' % "".join(nav) if nav else ""

    main = """
  <main id="main" class="container">
    <header class="t-head">
      <a class="page-head__back" href="index.html">%(back)s Theory</a>
      <p class="t-head__kicker">Region %(no)d</p>
      <h1>%(title)s</h1>
      <p class="t-head__summary">%(summary)s</p>
    </header>
    <div class="t-layout">
      <nav class="t-toc" aria-label="Contents">
        <details class="t-toc__d" open>
          <summary>Contents</summary>
          <ol>%(toc)s</ol>
        </details>
      </nav>
      <article class="t-body">
        %(banner)s
        %(objs)s
        %(body)s
        %(refs)s
        %(pn)s
      </article>
    </div>
  </main>
""" % {
        "back": BACK_ICON,
        "no": region.number,
        "title": esc(typo(region.title)),
        "summary": esc(typo(meta.get("summary", ""))),
        "toc": "".join(toc_html),
        "banner": banner,
        "objs": obj_box,
        "body": body,
        "refs": refs_html(used, sources),
        "pn": prevnext,
    }
    return page(
        "%s | Theory | Cranial Cervical Anatomy" % typo(region.title),
        meta.get("summary", ""),
        main,
        ' data-page="region"',
    )


def build_index_page(regions, sources):
    rows = []
    for r in regions:
        t, f, p = region_counts(r)
        n_o = len(r.lists["objectives"])
        n_s = len(r.lists["structures"])
        n_c = len(r.lists["clinical"])
        facts = "%d aims, %d structures" % (n_o, n_s)
        if n_c:
            facts += ", %d clinical topics" % n_c
        if r.meta is not None:
            action = '<a class="btn btn--small btn--primary" href="%s.html">Read</a>' % r.slug
            blurb = typo(r.meta.get("summary", ""))
            state = counts_line(f, p, t)
        else:
            action = '<span class="t-planned">Planned</span>'
            blurb = "Not written yet."
            state = ""
        rows.append(
            '<li class="row t-region"><div class="row__main"><p class="t-region__no">Region %d</p><h4>%s</h4>'
            '<p>%s</p><p class="t-region__facts">%s%s</p>%s</div><div class="row__actions">%s</div></li>'
            % (r.number, esc(typo(r.title)), esc(blurb), esc(facts), (" &middot; " + esc(state)) if state else "", meter(f, p, t), action)
        )
    refs = []
    for k, s in sources.items():
        if s.get("book") is False:
            continue
        refs.append("<li>%s <span class=\"t-refs__how\">%s</span></li>" % (esc(typo(s["ref"])), esc(typo(s.get("how", "")))))
    body = """
  <main id="main" class="container">
    <header class="page-head">
      <h1>Theory</h1>
      <p>Notes on head and neck anatomy, organised into nine regions, from the skull and vertebral column to the oral cavity. They are written for this site, and each section says which chapter or page of the textbooks it comes from, so you can check it and read further.</p>
      <p class="page-head__small">Regions are added one at a time. The table of contents shows what is covered so far.</p>
      <p class="t-head__actions"><a class="btn btn--primary" href="contents.html">Table of contents</a><a class="btn" href="../index.html#atlas">Diagrams</a></p>
    </header>
    <ul class="rows t-regions">%(rows)s</ul>
    <section class="t-about" aria-labelledby="about-h">
      <h2 id="about-h">How the notes are built</h2>
      <ul>
        <li>Every section ends with a sources line. Where the two textbooks differ, the notes say so.</li>
        <li>Clinical boxes, marked in red, link the anatomy to what it means in practice.</li>
        <li>Diagram links open the matching layers in the diagram viewer.</li>
        <li>Points that come from the author's own teaching and dental knowledge, rather than the textbooks, are labelled "Author's notes".</li>
      </ul>
      <h2 id="textbooks-h">Textbooks used</h2>
      <ol class="t-refs-list">%(refs)s</ol>
      <p class="t-about__note">The notes are an aid to study, not a substitute for the textbooks or for the course material.</p>
    </section>
  </main>
""" % {"rows": "".join(rows), "refs": "".join(refs)}
    return page(
        "Theory | Cranial Cervical Anatomy",
        "Head and neck anatomy notes by region, with textbook citations, clinical boxes and links to the diagrams.",
        body,
        ' data-page="index"',
    )


# ---------------------------------------------------------------------- main

def print_ids(regions):
    for r in regions:
        print("\n%d  %s  [%s]" % (r.number, r.title, r.slug))
        for k in LIST_KEYS:
            if not r.lists[k]:
                continue
            print("  " + LIST_TITLES[k])

            def show(items, depth):
                for it in items:
                    mark = {"full": "[x]", "partial": "[~]", "none": "[ ]"}[it.status]
                    print("   %s%s %-16s %s" % ("  " * depth, mark, it.id, it.text[:70]))
                    show(it.children, depth + 1)

            show(r.lists[k], 0)


def scaffold(argv, regions):
    """--new <slug>: write a draft region file with a heading for every structure in the table of contents."""
    by = {r.slug: r for r in regions}
    if not argv or argv[0] not in by:
        print("Usage: python3 tools/build_theory.py --new <region>   (regions: %s)" % ", ".join(by))
        return 1
    r = by[argv[0]]
    path = os.path.join(CONTENT, r.slug + ".md")
    if os.path.exists(path):
        print("%s already exists; not overwriting it." % path)
        return 1
    out = ["---", "slug: %s" % r.slug, "status: draft", "summary: Write one or two sentences here.", "---", "",
           "<!-- Draft. Remove the 'status: draft' line in the front matter when you want this page published.",
           "     Write under each heading in your own words, then add a Sources: line (Sources: own for your own knowledge).",
           "     A heading only counts toward the table of contents once it has text under it.",
           "     Aims for this region:"]
    out += ["       - %s" % it.text for it in r.lists["objectives"]]
    out += ["-->", ""]
    seen = set()
    for it in r.lists["structures"]:
        title = it.text.rstrip(":")
        hid = slugify(title) or it.id.replace(".", "-")
        while hid in seen:
            hid += "-2"
        seen.add(hid)
        out.append('## %s {#%s covers="%s"}' % (title[:1].upper() + title[1:], hid, it.id))
        out.append("")
        if it.children:
            out.append("<!-- Includes: " + "; ".join(c.text for c in it.children) + " -->")
            out.append("")
    for it in r.lists["clinical"]:
        out.append("<!-- Clinical topic %s: %s  (write it as a :::clinical box inside the section it belongs to) -->" % (it.id, it.text))
    open(path, "w", encoding="utf-8").write("\n".join(out) + "\n")
    print("Wrote %s. Open it, fill it in, then run: python3 tools/build_theory.py" % path)
    return 0


def main():
    args = sys.argv[1:]
    regions = load_objectives()
    if "--new" in args:
        return scaffold(args[args.index("--new") + 1:], regions)
    sources = load_sources()
    atlas = load_atlas()
    known = all_items(regions)
    by_slug = {r.slug: r for r in regions}

    coverage = {}
    drafts = []
    bodies = {}
    used_all = set()
    for fn in sorted(os.listdir(CONTENT)):
        if not fn.endswith(".md") or fn == "README.md" or fn.startswith("_"):
            continue
        slug = fn[:-3]
        if slug not in by_slug:
            err(fn, "no region '%s' in objectives.txt (regions: %s)" % (slug, ", ".join(by_slug)))
            continue
        region = by_slug[slug]
        meta, lines, offset = read_region_file(os.path.join(CONTENT, fn), slug)
        if not meta.get("summary"):
            err(fn, "front matter needs a 'summary:' line")
        nodes = segment(lines, offset, fn)
        if meta.get("status") == "draft":
            # checked like any page, but not published and not counted
            build_region_body(region, nodes, fn, sources, atlas, known, {})
            drafts.append(slug)
            continue
        region.meta = meta
        body, toc, used = build_region_body(region, nodes, fn, sources, atlas, known, coverage)
        bodies[slug] = (body, toc, used)
        used_all |= used

    apply_coverage(regions, coverage)

    if "--ids" in args:
        print_ids(regions)
        return 0
    if errors:
        print("\n".join(errors))
        print("\n%d problem(s). Nothing was written." % len(errors))
        return 1

    if "--check" not in args:
        for r in regions:
            if r.slug in bodies:
                body, toc, used = bodies[r.slug]
                with open(os.path.join(OUT, r.slug + ".html"), "w", encoding="utf-8") as fh:
                    fh.write(build_region_page(r, regions, body, toc, used, sources))
        with open(os.path.join(OUT, "index.html"), "w", encoding="utf-8") as fh:
            fh.write(build_index_page(regions, sources))
        with open(os.path.join(OUT, "contents.html"), "w", encoding="utf-8") as fh:
            fh.write(build_contents_page(regions, sources))

    tot = full = part = 0
    for r in regions:
        t, f, p = region_counts(r)
        tot, full, part = tot + t, full + f, part + p
        state = "written" if r.meta is not None else ("draft" if r.slug in drafts else "planned")
        print("  %d %-28s %-8s %s" % (r.number, r.title, state, counts_line(f, p, t)))
    print("Total: %s." % counts_line(full, part, tot))
    for k in sorted(used_all):
        if sources[k].get("confirm"):
            print("NOTE: the reference for '%s' is not confirmed yet (edit theory/content/sources.json)." % k)
    if "--check" not in args:
        old = os.path.join(OUT, "objectives.html")
        if os.path.exists(old):
            os.remove(old)  # the checklist page was renamed contents.html
    print("Checked only; nothing written." if "--check" in args else "Built into theory/.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
