# Caravan v1.0.0

A playable recreation of **Caravan from Fallout: New Vegas** for **The Wand
Company Pip-Boy 3000**, built specifically for firmware **1.1.6** and its
memory-constrained Espruino runtime.

## Features

- Player-vs-CPU Caravan gameplay.
- Randomized 54-card decks.
- Number cards, Aces, Jacks, Queens, Kings, and Jokers.
- Three caravans per player.
- Betting and ante selection.
- Ascending and descending caravan rules.
- Same-suit override behavior.
- 21–26 selling range.
- Correct tie handling.
- Two-of-three caravan win detection.
- Randomized Fallout: New Vegas opponents.
- Guided Demo / Tutorial.
- Rematches.
- Challenge New Opponent.
- Disband Caravan support.
- Opening discard/redraw support.
- Deck-exhaustion loss handling.
- Animated bottle-cap win/loss results.
- Configurable game sound effects and background music.
- Persistent audio volume settings.
- Low-memory lifecycle logging.

## Resident Runtime Architecture

Caravan uses a low-memory resident-runtime design intended to improve stability
across consecutive matches.

The Game Engine, Renderer, and Game Audio systems load once for the current
Caravan play session. When a match ends, only match-specific data such as decks,
hands, caravans, directions, and current match state is released.

Selecting **Rematch** rebuilds the match data while keeping the resident
gameplay modules loaded. **Challenge New Opponent** performs an in-place
resident match reset and selects a different opponent.

## Opponents

Real matches randomly select from 14 Fallout: New Vegas Caravan players:

- Cliff Briscoe
- Dale Barton
- Ambassador Dennis Crocker
- Isaac
- Private Jake Erwin
- Johnson Nash
- Jules
- Keith
- Lacey
- Little Buster
- Quartermaster Mayes
- No-bark Noonan
- Ringo
- Jed Masterson

**Rematch** keeps the current opponent.

## Gameplay Rules

### Jack

Removes the targeted numeric card and its attached face cards.

### Queen

Reverses the caravan's current direction and changes its effective suit.

### King

Doubles the value of the targeted numeric card. Additional Kings multiply the
value again.

### Joker

When played on an Ace, removes other numeric cards of that Ace's suit from both
boards.

When played on a 2–10, removes other numeric cards of that rank from both
boards.

### SOLD / Ties

A caravan must be within the valid selling range and actually beat the opposing
caravan to count as **SOLD**. Equal totals remain tied.

## Controls

### Menus

- Left wheel: move selection.
- Left wheel press: select.
- On the bet screen, right wheel adjusts the current ante.

### Game

- Left wheel: choose one of your three caravans.
- Left wheel press: open or confirm the Card Action popup.
- Right wheel: scroll cards in your hand; while the Card Action popup is open,
  scroll its options.
- Card Action options: Play Card, Discard Card, Disband Caravan, Back.
- Discard draws a replacement when cards remain and ends the player's turn.
- Disband clears the selected caravan and ends the player's turn.

## Audio

Caravan includes:

- Playing Card sound — Sound Effect by Alex from Pixabay.
- Discard sound — Sound Effect by Alex from Pixabay.
- Bottle Cap result audio — sound already included with the Pip-Boy 3000.
- Background music: **Lazy Day - Tired** — Music by Geoff Harvey from Pixabay.

The music asset is encoded as 16 kHz mono IMA ADPCM using 1024-byte blocks for
Pip-Boy playback.

## Diagnostics

`CARAVAN.LOG` records short lifecycle markers with free and total Espruino
variable blocks at important points such as game ready, results, match-data
cleanup, and rematch startup.

Example markers:

```text
CV G# READY F#### T####
CV G# RESULT ... F#### T####
CV G# DATAFREE F#### T####
CV G# REMATCH F#### T####
```

The game number increments only after a match becomes ready.

## Target

- Device: The Wand Company Pip-Boy 3000
- Firmware: 1.1.6
- Runtime: Espruino JavaScript
- Display: 480×320
- Version: 1.0.0

## Credits

- **Holotape image:** Goji — created the Caravan game cover/thumbnail artwork.
- **Playing Card / Discard sound effects:** Alex from Pixabay.
- **Lazy Day - Tired:** Geoff Harvey from Pixabay.
- **Caravan:** based on the card game from Fallout: New Vegas.
