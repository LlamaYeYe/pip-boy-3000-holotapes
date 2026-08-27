# S.O.P.H.I.A. — Companion Pip-Boy Framework

S.O.P.H.I.A. (Speech-Optimized Personal Health & Information Assistant) adds
selectable Fallout-themed companion voices to The Wand Company Pip-Boy 3000.

Version **1.0.0** includes five companion personalities:

- YES MAN
- FISTO
- KL-E-O
- MK II Stealth Suit
- Andy (Mister Handy)

Choose one companion from the S.O.P.H.I.A. holotape and it will provide
contextual voice responses while you move through supported Pip-Boy menus.

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
- The compact resident service is designed for the Pip-Boy's limited memory and
  is parked while the S.O.P.H.I.A. configuration holotape is open.

## Installation

Runtime files are installed to:

`HOLO/Project_Sophia/`

Physical Pip-Boy hardware testing is authoritative.
