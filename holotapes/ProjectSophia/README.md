# S.O.P.H.I.A. — Companion Pip-Boy Framework

S.O.P.H.I.A. (Speech-Optimized Personal Health & Information Assistant) adds
selectable Fallout-themed companion voices to The Wand Company Pip-Boy 3000.

Version **1.0.0** supports five companion personalities:

- YES MAN
- FISTO
- KL-E-O
- MK II Stealth Suit
- Andy / Mister Handy

## Source and runtime files

Readable JavaScript sources are kept in `assets/*.JS`. The Pip-Boy installer
uses the matching compact `*.MIN.JS` runtime files where provided to preserve
the tested low-memory behavior on hardware.

## Modular custom installation

The S.O.P.H.I.A. core installs separately from its voice banks. On pip-boy.com,
each companion voice bank is exposed through `storageOptional`, so users can
install only the voices they want.

The five small `.IDX` index files are part of the core. Each large `.BIN` voice
bank is optional. S.O.P.H.I.A. checks for the matching `.BIN` and `.IDX` pair
when the holotape opens and only lists companions that are actually installed.

Examples:

- Install YES MAN only → only **YES MAN** appears.
- Install FISTO + KL-E-O → only **FISTO** and **KL-E-O** appear.
- Install all five voice packs → all five companions appear.
- Install the core with no voice packs → the holotape reports that no voice
  packs are installed and still provides a Back option.

If the currently configured companion is later removed, S.O.P.H.I.A. safely
disables it and falls back to the first installed voice instead of exposing a
dead menu entry.

## Supported menus

- Weapons
- Apparel
- Aid
- Misc
- Ammo
- SPECIAL
- Skills
- Perks
- General
- CND
- EFF
- CLK
- ENG
- Quests
- Notes
- Fallout: New Vegas mode switch
- Fallout 3 mode switch

## Runtime behavior

- Only one companion is active at a time.
- Up to three voice responses can play during a supported menu visit.
- The first response is targeted for roughly three seconds after entering a
  supported menu.
- Later responses use a fresh randomized delay.
- Leaving and re-entering a menu resets that menu's response sequence.
- Repeated voice lines are avoided during the same menu visit.
- MAP and STATUS RAD remain silent.
- RADIO/FM and other active audio or video block companion playback without
  consuming the response limit.
- Voice extraction is chunked/yielded so the Pip-Boy UI remains responsive while
  a line is prepared.
- The compact resident service is parked while the S.O.P.H.I.A. configuration
  holotape is open and resumes when leaving.

## Repository / runtime layout

Readable launcher source is kept in `assets/APP.JS`.

The device runtime uses the compact `assets/APP.MIN.JS` through `metadata.json`,
keeping the public source human-readable while preserving the hardware-tested
low-memory launch path.

Runtime files install under:

`HOLO/Project_Sophia/`

S.O.P.H.I.A. uses one narrow resident service handle because companion speech
intentionally continues after the configuration holotape exits. The
configuration UI receives that service directly rather than creating additional
UI globals, and the service cleanup path removes its owned timers/listeners and
resident handle when destroyed.

Physical Pip-Boy hardware testing remains authoritative.
