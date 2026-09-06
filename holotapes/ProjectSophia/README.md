# Project S.O.P.H.I.A. v1.0.0

Project S.O.P.H.I.A. is a companion voice framework for the Wand Company Pip-Boy 3000 with five selectable companions and contextual voices across supported menus.

The current architecture separates the holotape UI from a detached navigation router and a transient voice engine:

- `APP.JS` — readable holotape UI and configuration source.
- `SOPHIA_ROUTER.JS` — readable navigation/lifecycle source.
- `SOPHIA_VOICE_ENGINE.JS` — readable contextual voice/audio source.
- `assets/*.MIN.JS` — compact device runtime files installed by `metadata.json`.

## Supported voice contexts

- ITEMS: Weapons, Apparel, Aid, Ammo.
- STATUS: CND, EFF, CLK, ENG.
- STATS: SPECIAL, Skills, Perks, General.
- DATA: Quests, Notes.
- DATA > Settings: Fallout 3 / Fallout: New Vegas mode-change responses.

MISC is intentionally silent. RAD is intentionally silent, but the engine remains active while passing through RAD so EFF, CLK, and ENG can respond without leaving STATUS.

## Companion packs

- YES MAN
- FISTO
- KL-E-O
- MK II Stealth Suit
- Andy / Mister Handy

## Source and runtime policy

The normal `.JS` files are the human-readable source of truth and use descriptive names and conventional formatting.

The `.MIN.JS` files are the memory-oriented device runtime. They intentionally use compact identifiers and are kept separate from readable source.

`SOPHIA_ROUTER.JS` and `SOPHIA_VOICE_ENGINE.JS` are eval-loaded modules. Automatic identifier mangling for these modules should not be enabled blindly on Espruino because its `let`/`const` scoping differs from desktop JavaScript. See `BUILD.md`.

This repository-source cleanup does not change the hardware-tested runtime bytes in `assets/*.MIN.JS`.
