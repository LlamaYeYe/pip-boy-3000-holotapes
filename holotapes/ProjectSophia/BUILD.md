# Project S.O.P.H.I.A. Build Notes

Target: Wand Company Pip-Boy 3000, firmware 1.1.6, Espruino.

## Readable source

Keep these files human-readable and reviewable:

- `APP.JS`
- `SOPHIA_ROUTER.JS`
- `SOPHIA_VOICE_ENGINE.JS`
- `metadata.json`
- `README.md`
- `ChangeLog`

Use descriptive names for nontrivial state and functions. Tiny counters/coordinates may stay short where appropriate.

## Runtime minification

The runtime files live under `assets/` and are installed to the device as normal `.JS` files through `metadata.json`.

A conservative Terser pass is:

```sh
terser APP.JS -c negate_iife=false,side_effects=false,directives=false -o assets/APP.MIN.JS
terser SOPHIA_ROUTER.JS -c negate_iife=false,side_effects=false,directives=false -o assets/SOPHIA_ROUTER.MIN.JS
terser SOPHIA_VOICE_ENGINE.JS -c negate_iife=false,side_effects=false,directives=false -o assets/SOPHIA_VOICE_ENGINE.MIN.JS
```

### Mangling caution

`SOPHIA_ROUTER.JS` and `SOPHIA_VOICE_ENGINE.JS` are loaded with `Function(...)` at runtime. Do not automatically add Terser `-m` to eval-loaded modules unless the result has been proven safe on the Pip-Boy.

Espruino does not implement desktop-style block scoping for `let`/`const`, so unsafe automatic name reuse can cause hardware-only variable clobbering.

The current hardware-tested `.MIN.JS` files already use compact identifiers and are intentionally preserved by this source-readability update.

## Pretokenisation

Pretokenisation is a separate Espruino build step after minification:

```sh
espruino assets/APP.MIN.JS --config PRETOKENISE=2 --config SET_TIME_ON_WRITE=false -o assets/APP.MIN.JS
espruino assets/SOPHIA_ROUTER.MIN.JS --config PRETOKENISE=2 --config SET_TIME_ON_WRITE=false -o assets/SOPHIA_ROUTER.MIN.JS
espruino assets/SOPHIA_VOICE_ENGINE.MIN.JS --config PRETOKENISE=2 --config SET_TIME_ON_WRITE=false -o assets/SOPHIA_VOICE_ENGINE.MIN.JS
```

Pretokenised output must be hardware-tested before replacing the current known-good runtime in a release.

## Release checks

- IIFE wrapper remains a bare function expression with no trailing invocation.
- Returned app object keeps `id` and `remove()`.
- Every listener and timer has cleanup.
- No unsupported browser/Node APIs.
- No `Math.random()`.
- No blanket `Pip.remove()` / `clearWatch()`.
- Every dynamically loaded file exists in `metadata.json`.
- Repeated open/back, STATUS, MISC, Radio, Settings, and sleep/wake are tested on hardware.
