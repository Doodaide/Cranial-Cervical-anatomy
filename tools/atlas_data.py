"""Shared loader for data/atlas.js (strict JSON after 'window.ATLAS = ')."""
import json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def load_atlas():
    text = open(os.path.join(ROOT, "data", "atlas.js"), encoding="utf-8").read()
    start = text.index("window.ATLAS =") + len("window.ATLAS =")
    return json.loads(text[start:].strip().rstrip(";"))
