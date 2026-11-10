# 2048 addition

This bounded existing-game extension reuses the Jekyll blog's game layout. It
does not claim full OMD workflow certification. No runtime dependency was added.
The game is continuous free play; existing date-generated games remain unchanged.

## Executed verification

- All 16 engine tests passed, including the six new 2048 tests. The new tests
  cover directional compaction, single-merge order, score, spawn thresholds,
  no-op moves, invalid data, victory and available moves. A 500-board invariant
  sweep checked rotation equivalence, sum preservation and merge accounting.
- The Jekyll build passed. Existing Liquid warnings in the visualization-libraries
  post are unchanged.
- Local browser tests passed at 1280×900, 390×844 and 320×844: board-only keyboard
  and WASD, no-op without spawning, direction buttons, undo, reload and next-day
  persistence, confirmed/cancelled restart, best-score retention, swipe threshold
  and no horizontal overflow. Direction controls measured at least 44×44px.
- Near-win and continued-game fixtures exercised actual moves into 2048 and 4096,
  including paused movement, victory undo, continuing, saved continuation, and
  mobile tile fit. A stalled board verified the reachable restart path.
- Corrupt JSON and an allzero saved board both recovered to a new game while
  retaining a valid best score. Storage denial left play and undo usable.
- Native touch swipes and pointer cancellation passed. A missing engine asset
  produced the refresh notice and recovered after reload.
- Initial, victory, continued and game-over screenshots were inspected. A render
  check's low-contrast attribution link was darkened; the final initial-state check
  reported no severity-error findings. Inherited advisory findings are not claimed
  as clean.
- A separate render-only reviewer found no visible blockers across desktop,
  320px/390px initial views and mobile win, continued and game-over views. Exact
  target sizes and behavior are supported by browser tests rather than that verdict.

## Implementation notes

Storage uses separate versioned state and best-score keys. Undo restores board,
score and continuation state, while preserving the best score; it does not rewind
the random source. New games retain the best score. Move keys are handled only by
the focused board and do not capture Alt/Ctrl/Meta shortcuts.

Tile descriptions expose their row, column and value. Board gestures do not block
scrolling elsewhere. Reset focus uses an explicit centered scroll to avoid the
fixed header covering the board.

Rules and creator attribution were checked against the original public game and
its game-manager source. The implementation uses its own array-based engine and
existing blog styles; no upstream code or image assets were copied.
