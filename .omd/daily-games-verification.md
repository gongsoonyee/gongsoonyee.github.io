# Date-generated mini games

## Scope and decisions

This is a bounded extension of the existing Jekyll game screen. The existing
composition, header and styling were reused; this record does not certify a full
OMD composition workflow. No new runtime dependency was added.

Shikaku and Zip generate a board from game/version/date. Solvers prove uniqueness;
Zip's explicit search-budget exhaustion is never treated as a uniqueness proof.
All generation choices depend on deterministic work, not elapsed wall time.
Versioned snapshots protect already published puzzle identities.

Tango preserves the exact November 1–10, 2026 published archive and its save keys.
November 11 onward uses `daily-v1`. The former future bank was removed. The archive
cutoff is capped explicitly so a cached older 400-entry bank cannot override the
new generator. Asset URLs were versioned for the transition.

## Executed verification

- Engine tests cover deterministic inputs, versioned snapshots, valid solutions,
  uniqueness across sampled dates, independent counters, invalid moves, KST day
  boundaries, leap days and Zip budget exhaustion.
- Tango: independent uniqueness checks across 366 generated dates; legacy archive
  identity checked against the previously committed first ten puzzles.
- Browser tests at 1280×900 and 390×844 cover both new games through completion,
  including invalid moves, clicks, drags, keyboard, undo, hints, guarded reset,
  saved completion, date-local progress, browser history, future dates and KST rollover.
- Native touch-event drags and taps passed, as did quota-exhaustion memory recovery
  and missing-engine asset recovery through the retry control.
- Updated Tango browser tests passed for legacy gameplay and generation beyond
  the former bank end. A generated puzzle was completed through real cell clicks;
  reload persistence, the separate save key and a stale 400-entry bank were checked.
- Jekyll build passed. Existing Liquid warnings in the visualization-libraries
  article remain outside this change.
- Render checks reported no severity-error accessibility findings for either new
  game; inherited token/spacing/type-scale advisories are not claimed as clean.

## Render and interaction refinement

An actual drag test found reset focus scrolling the first board row behind the
fixed header. Reset now focuses without automatic scrolling and centers the board.
The test passed afterward. Game dropdown targets were enlarged to 44px.

Initial and completed renders were inspected on mobile and desktop. An independent
render-only reviewer found no concrete visual blockers and noted that Shikaku's
first-view copy should explain the one-number/area rule. The introduction was
changed to state that rule. Completion remains visible through region borders
and labels for Shikaku and the drawn path for Zip, not colour alone.

The independent visual verdict covers the supplied renders only. Interaction,
storage and recovery conclusions come from the executed browser tests.
