# Daily Tango verification

The existing Jekyll/Liquid stack was retained. No frontend runtime dependencies
were added. The full OMD composition pipeline was not completed; see decisions.md
for the observed tool and contract limitations. This record makes no claim of
full pipeline certification.

## Executed checks

- `node --test tests/tango.test.cjs`: three tests passed, including independent
  solution counting for all 400 scheduled puzzles and KST midnight boundaries.
- `node --check assets/js/tango.js` and `tango-engine.js`: passed.
- Jekyll 3.8.5 build to `/tmp/tango-site`: passed with the repository's locked
  dependencies. Installing locked ffi 1.10.0 on this macOS required local system
  libffi headers and a compiler flag; no manifest or lockfile was changed.
- The build still emits Liquid warnings from the pre-existing
  `_posts/2026-08-12-visualization-animation-libraries.md` examples.
- `tests/tango-browser.cjs` against the actual served Jekyll build passed at
  1280×900 and 390×844: menu, moves, undo, reload persistence, guarded reset,
  hints, date-isolated archive state, browser back, future-date fallback,
  completion and resumption, KST rollover, and horizontal overflow.
- Error/retry, blocked storage with in-session date switching, and exhausted
  bank fallback passed browser tests.
- Final `omd check` reported no severity-error accessibility findings. Advisory
  token, spacing and type-scale findings are not claimed as clean.
- Asset source scan returned no Tango candidates. Existing asset findings are
  outside this feature.
- Final sharp desktop/mobile renders were visually inspected. The refinement
  enlarged secondary text, darkened low-contrast labels, increased rule-summary
  targets, and corrected theme header measurement affecting top spacing.

## Scope

The bank covers 2026-11-01 through 2027-12-05. Extend its deterministic sequence
before the end date; no silent cycling is implemented. Records are local to the
browser. The source was changed locally; no deployment or push was performed.
