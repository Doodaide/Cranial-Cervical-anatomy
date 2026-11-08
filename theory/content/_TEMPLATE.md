---
slug: REGION
summary: One or two sentences about what this page covers. It appears under the title and on the Theory index.
---

<!--
  HOW TO USE THIS FILE
  1. Copy it to theory/content/<region>.md (the region names are the slugs in objectives.txt: skull, thorax, neck, face, tmj, itf, cranial, orbit, oral),
     or let the tool make a draft with a heading for every topic:   python3 tools/build_theory.py --new thorax
  2. Replace everything below with your own notes. Keep the pattern: a heading, text, then a Sources: line.
  3. Build:   python3 tools/build_theory.py      (or just save the file on GitHub; see README.md)

  Lines starting with <!--  are comments and never appear on the page.
-->

## A section title {#a-section-id covers="REGION.s1"}

Write your explanation here. Use plain paragraphs. Put important terms in **bold** the first time they appear, and use *italics* for emphasis.

You can mix sources. Put each source line directly after the text it supports:

Sources: cunn ch. 2, pp. 5–6; last Ch. 6, Part 19 (A typical cervical vertebra)

Your own knowledge goes in the same way, labelled so readers can tell it apart from the textbooks:

Sources: own

### A sub-section

- A bulleted list
- Another point

1. A numbered list
2. Another step

| Column A | Column B |
| --- | --- |
| A table | is written like this |

Sources: own

:::clinical A clinical box, with a title {covers="REGION.c1"}
What the anatomy means for a patient. Use this for diagnosis, injury, complications and surgical risks.

Sources: last Ch. 6, Part 16 (Temporomandibular joint)
:::

:::dental A dental box, with a title
What it means in dental practice: local anaesthesia, extractions, infection spread and so on. This is the place for your own dental knowledge.

Sources: own
:::

:::keypoint Short summary
- Two or three points to remember
- Keep each to one line
:::

:::note Where the sources differ
Use this when Last's and Cunningham disagree, or when something is disputed.

Sources: cunn ch. 2, p. 6; last Ch. 6, Part 19 (A typical cervical vertebra)
:::

::diagram cervical-vertebrae on=bones,bone-labels | Caption for a link that opens this diagram in the viewer with those layers on.

<!--
  COVERS: covers="ID" on a heading says "this section explains this topic from the table of contents".
  Add ~ for partial cover (covers="REGION.s1~"). Run  python3 tools/build_theory.py --ids  to list every ID.
  A heading only counts as covering a topic once it has text under it.

  SOURCES: the short names are in sources.json:  last  (Last's, cite by chapter, part, heading),
  cunn (Cunningham, cite by page: p. 7 or pp. 5–8),  own  (your own notes, no locator needed).
-->
