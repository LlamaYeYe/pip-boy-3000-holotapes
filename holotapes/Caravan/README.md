# Caravan v1.0.0 - Resident Runtime Test 2A

Memory-stability test for the Wand Company Pip-Boy 3000 (firmware 1.1.6).

## What changed

- Engine loads once per Caravan play session.
- Renderer loads once per Caravan play session.
- Game Audio loads once per Caravan play session.
- At Results, only the current match data (decks, hands, caravans, directions)
  is released.
- Rematch rebuilds match data using the already-loaded Engine/Renderer/Audio
  modules.
- No Renderer or Game Audio eval/load happens on Rematch.
- Play/Discard use the previously tested short WAV playback with explicit
  stop/unload timers.
- `SOLD` now requires actually beating the opposing caravan; equal totals such
  as 26 vs 26 remain tied.
- Real matches now randomize among the 14 Fallout: New Vegas Caravan players.
- Results offers `Rematch`, `Challenge New Opponent`, and `Back`; Rematch keeps
  the same opponent while Challenge New Opponent performs an in-place resident
  match reset with a different opponent.

Music asset: "Lazy Day - Tired" (16 kHz mono IMA ADPCM, 1024-byte blocks).

## Installation / PC Testing Note

Caravan is a modular holotape. `APP.JS` cannot run by itself.

A complete install must include every file listed in `metadata.json`, especially
the runtime modules installed under `HOLO/CARAVAN/`, including
`CARAVAN_MENU_INTERFACE.MIN.JS`, `CARAVAN_GAME.MIN.JS`,
`CARAVAN_GAME_ENGINE.MIN.JS`, `CARAVAN_DRAW_SCREEN.MIN.JS`, and the remaining
audio, graphics, tutorial, volume, and result assets.

Uploading or running only `APP.JS` from a PC/editor can start Caravan and then
fail with `NO_FILE` when it tries to load the first missing module. Use the
complete metadata-driven package for normal testing.
