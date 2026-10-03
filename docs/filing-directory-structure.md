# Personal Filing Directory — structure summary

Faithful extraction from [Personal_Filing_Directory_Manual.md](./Personal_Filing_Directory_Manual.md). Nothing invented beyond that source.

**Core principle:** One true home per file. Organize by **content type** first (not by project). For event-like content, **permanence** is the key differentiator.

---

## Top-level tree

```
A — Productivity
├── A1 Personal
├── A2 Work
├── A3 Study Material
├── A4 Exams
│   └── A41 CPR
└── A5 Travel

B — Image
├── B1 Personal
├── B2 Work
├── B3 Notes
└── B4 Wallpaper

C — Media
├── C1 Music
│   ├── C11 Songs
│   └── C12 Ringtone
└── C2 Video
    ├── C21 Animate
    └── C22 Movie

D — Program
├── D1 Personal
└── D2 Work

E — Games
├── E1 Minecraft
│   ├── E11 Save
│   ├── E12 Mod
│   └── E13 Skin
├── E2 Euro Truck Simulator 2
├── E3 Cities Skylines 2
└── E4 Satisfactory

F — Finance
├── F1 E-Bills
├── F2 Bank Statement
└── F3 Email Confirmation

G — Peoples
├── G1 Self
├── G2 Serena
├── G3 Family
├── G4 Company
└── G5 Other People

H — Household Affair
├── H1 Instruction manuals
├── H2 Household Finance
└── H3 Asset

I — Idea                    (reserved)

K — Kreative

L — Library

R - Raw

S — Special Event

T — Temporary

U — Unsorted

V — Device Backup

X — One-off Event

Z — Quick Access
```

**Reserved / unused letters (open for future categories):** J, M, N, O, Q, W, Y.

---

## Purpose of each major folder

| Code | Folder | Purpose |
| --- | --- | --- |
| **A** | Productivity | Learning, work projects, study, exams, travel |
| A1 | Personal | Soft-skill / personal development learning (non-technical) |
| A2 | Work | Active work projects — includes project-embedded financial data (e.g. a budget line in a project plan) |
| A3 | Study Material | Technical / subject knowledge hub |
| A4 | Exams | Exam-specific materials (soft-skill or technical); includes A41 CPR |
| A5 | Travel | All travel — logistics and memories, regardless of trip significance |
| **B** | Image | Photos and other images by role |
| B1 | Personal | Personal photos |
| B2 | Work | Work-related images |
| B3 | Notes | Screenshots / informational images |
| B4 | Wallpaper | (no further rule stated) |
| **C** | Media | Music and video |
| C1 | Music | Songs (C11), Ringtone (C12) |
| C2 | Video | Animate you **watch** (C21); Movie (C22). Self-made creative work → K |
| **D** | Program | Non-game software only (D1 Personal, D2 Work) |
| **E** | Games | Per-game homes (Minecraft + Save/Mod/Skin; ETS2; Cities Skylines 2; Satisfactory) |
| **F** | Finance | Personal-only items with a $ sign attached |
| F1–F3 | E-Bills / Bank Statement / Email Confirmation | Personal finance artifacts |
| **G** | Peoples | Strictly information *about* a person or pet (documents, health, correspondence) |
| G1–G5 | Self / Serena / Family / Company / Other People | Company = company documents not tied to an active project |
| **H** | Household Affair | Manuals, shared finance, vehicle/house docs |
| H1 | Instruction manuals | |
| H2 | Household Finance | Shared/household bills (split with others) |
| H3 | Asset | Vehicle and house documents |
| **I** | Idea | Reserved (no substructure defined) |
| **K** | Kreative | Design / creative assets you make yourself |
| **L** | Library | Books / eBooks |
| **R** | Raw | Raw system / folder-meta files for the filing tree itself (e.g. Readme, Thumbnail) |
| **S** | Special Event | Permanent, memorable, kept forever — major life milestones (e.g. house buying, marriage); not routine travel |
| **T** | Temporary | Short-lived use only (transfers, testing); not kept more than a few days |
| **U** | Unsorted | Temporary holding pen; organized monthly; **1-year maximum** before it must be sorted into a real category |
| **V** | Device Backup | (no further rule stated) |
| **X** | One-off Event | Short projects/events; deleted once the project or event is over |
| **Z** | Quick Access | Manual shortcut/symlink hub only — **no duplicate real files**; curated manually, not rule-based |

---

## Naming / filing rules

Drawn only from the Manual’s stated rules (folder names/codes as given; no extra naming convention beyond that).

1. **One true home per file** — content type first, not project-first.
2. **Permanence** decides event-like homes: S (forever) vs X (delete after event) vs T (days).
3. **B note:** Memes / images with no informational or aesthetic value are not kept long-term.
4. **F:** Personal-only finance ($ attached). Shared/household bills → **H2**.
5. **G:** Info about a person/pet only. **Photos always stay in B/C**, never G.
6. **C21 vs K:** Animation you watch → C21; animation/creative you make → K.
7. **D vs E:** Programs are non-game software only; games live under E.
8. **A2 vs F vs G4:** Active work project (even with $ inside) → A2; personal-only $ → F; company docs with no active project → G4.
9. **A1 vs A3 vs A4:** Soft-skill development → A1; technical knowledge → A3; exam materials (either kind) → A4.
10. **A5 vs S:** All travel → A5; major life milestones only → S.
11. **Z:** Symlinks/shortcuts only; every file’s true home remains in its category (A–L, R, S–X).
12. **R:** Folder-meta / system files for the filing structure itself (Readme, Thumbnail, etc.), not ordinary content.

---

## Constraints & open questions

### Constraints (from Manual)

- Do not duplicate real files under Z.
- Do not put photos in G.
- Do not park routine travel in S (use A5).
- Do not keep T beyond a few days; do not keep U beyond 1 year unsorted.
- Delete X contents when the short project/event ends.
- Letters J, M, N, O, Q, W, Y are reserved unused — do not invent categories there without Edward.

### Open questions for Edward

1. **Root path / OS layout:** Manual defines letter codes and folder names, not the absolute root (e.g. `~/Filing/`, Drive, Windows drive letter) or whether codes appear in folder names (`A — Productivity` vs `A` vs `Productivity`).
2. **I — Idea** and **V — Device Backup:** Reserved / unnamed detail — any intended subfolders or retention rules?
3. **B4 Wallpaper, C1/C11/C12, D2, E2–E4, H1:** Listed with little or no rule text — confirm empty cells mean “name only, no extra rule.”
4. **G2 Serena / G3 Family:** Confirm these person/pet buckets are fixed names to create as-is.
5. **Migration:** Does this Manual describe the **target** only, or also how to move from the current PC layout?
