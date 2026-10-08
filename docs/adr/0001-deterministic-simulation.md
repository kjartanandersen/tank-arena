# ADR 0001: Deterministic simulation

- **Status:** Accepted
- **Date:** 2026-10-08
- **Scope:** `packages/core`, `packages/sim`, `packages/ai`, `packages/game`

## Context

Several planned features need the game to produce exactly the same result from the same inputs, on every machine:

- **Server-verified leaderboards.** The server re-simulates a submitted input log and must reach the same final state as the player's browser, bit for bit. Otherwise genuine runs get rejected.
- **Replays.** A run is stored as a seed plus an input log (kilobytes, not video), and playback re-simulates it.
- **Debugging and balancing.** A bug report is reproducible from `(seed, inputs)`, and AI-vs-bot tournaments in the headless CLI give the same result every time.

The simulation runs in at least three JavaScript engines: V8 (Chrome, Edge, and Node on the server), SpiderMonkey (Firefox) and JavaScriptCore (Safari). Several things can differ between runs or between engines:

- **Wall-clock time and frame timing** (`Date`, `performance.now()`, variable frame deltas).
- **`Math.random()`**, which can't be seeded.
- **`Math.sin`, `cos`, `tan`, `atan2`, `exp`, `log`, `pow`, `hypot`** and their relatives. ECMAScript calls these _implementation-approximated_, so engines may disagree in the last bit. Over thousands of ticks, a one-ulp difference in an angle can decide whether a bullet ricochets or not, and from then on the two runs diverge.
- **The `**` operator**, which has `Math.pow` semantics.
- **Hidden state** in closures or class instances, which makes snapshots, restores and state hashes unreliable.

By contrast, `+ - * /` on float64 are exactly specified IEEE 754 operations. JavaScript has no fused multiply-add and no extended precision, so these give identical results everywhere. Every major engine computes `Math.sqrt` with the hardware's correctly rounded instruction. The cross-engine test (below) checks this rather than assuming it.

## Decision

The simulation is a pure function of _(level, seed, difficulty, input log)_. It advances in whole ticks at a fixed 60 Hz, under these rules:

1. **Fixed timestep.** Time inside the simulation is `world.tick`, never real time. The client accumulates real time and runs whole steps, at most 5 per frame. Rendering interpolates between steps. (In place: `apps/web/src/game/mount.ts`.)
2. **Arithmetic.** Use float64 with only `+ - * /`, `Math.sqrt`, `floor`, `round`, `abs`, `min`, `max`, `imul` and `fround`. Trigonometry and other approximated functions come from `detMath` in `@arena/core`. It uses range reduction plus polynomial approximations built only from basic operations. Lookup tables are never generated at runtime with `Math.sin`.
3. **Randomness.** A seeded PRNG (`sfc32` or `xoshiro128**`) built on 32-bit integer operations (`Math.imul`, `>>> 0`). Named streams (`ai`, `spread`, `spawn`) are forked from the match seed.
4. **State is plain serializable data**: objects, arrays, numbers and strings, including AI memory. No class instances or closures may hold state. A snapshot is then a structured clone, and the state hash (FNV-1a or xxhash32) runs over quantized state.
5. **Stable iteration.** Entities live in arrays ordered by ID, and every tie-break is explicit (for example, A\* breaks ties by `f`, then `h`, then tile index).
6. **Inputs are the source of truth.** `TankCommand` is the only way anything drives a tank, player or AI. The aim angle is quantized to `uint16` _before_ it is used or logged.
7. **Debug tooling is read-only.** Overlays never draw from the RNG or write state.
8. **Versioning.** `SIM_VERSION` is stamped on run tickets and replays, and any behaviour change bumps it.

## Enforcement

| Mechanism                                                                                                                                                                                                            | Status        |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| ESLint determinism profile (`eslint.config.js`). In the four simulation packages it bans `Date`, `performance`, timers, `window`, `document`, `process`, `Math.random`, engine-dependent `Math.*` functions and `**` | In place (M0) |
| Layering rule: `core ← sim ← ai ← game`, and no `react`, `pixi.js`, `zod` or `node:*` imports                                                                                                                        | In place (M0) |
| `"types": []` in `tsconfig.base.json`, so no DOM or Node globals by default                                                                                                                                          | In place (M0) |
| Same inputs twice give the same state (`packages/game/src/match.test.ts`)                                                                                                                                            | In place (M0) |
| `detMath` accuracy bounds and exact golden outputs                                                                                                                                                                   | M1            |
| Golden replays: committed input logs with expected state hashes every 600 ticks                                                                                                                                      | M1            |
| Cross-engine test: Vitest browser mode on Chromium, Firefox and WebKit must match Node's hashes                                                                                                                      | M1            |

## Consequences

**Positive**

- Replays and leaderboard verification are cheap and exact.
- Any bug can be reproduced from a seed and an input log.
- The simulation runs headless (CLI, server, tests) with no platform dependencies.

**Negative**

- Simulation code can't call `Math.sin` and friends. `detMath` has to be written, tested and maintained, and it is a little slower than native.
- Any change to simulation or AI behaviour invalidates existing replays and leaderboard entries. This is handled with `SIM_VERSION` "seasons". Replaying old versions would need archived simulation bundles (a stretch goal).
- Plain-data state rules out some convenient patterns, such as stateful classes, and makes some code more verbose.
- Float determinism relies on engines never using extended precision or FMA. That holds for JavaScript today, and the cross-engine test checks it continuously rather than taking it on trust.

## Alternatives considered

- **Fixed-point integers.** These are deterministic by construction. But multiplying two 16.16 values overflows the 2^53 range of a JavaScript number, so every multiplication would need `BigInt` or split arithmetic, which makes the code slower and more error-prone. We'd only revisit this if the cross-engine test finds float drift.
- **Use `Math.*` and hope.** Engines agree most of the time, so this would pass casual testing and then fail on a fraction of real runs, which is the worst possible failure mode for anti-cheat.
- **An authoritative game server streaming state.** This needs a persistent server, which conflicts with serverless hosting on Netlify. It would also add latency to a single-player game.
