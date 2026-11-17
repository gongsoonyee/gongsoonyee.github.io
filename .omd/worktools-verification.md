# WorkTools Diff Checker

Existing Jekyll extension, using default layout and dedicated vanilla assets.
The design framer classified this as a product surface: compare two plain-text
work objects, then choose a destination for each change. Undo addresses the
costliest error, applying text in the wrong direction. This bounded implementation
does not claim completion or certification of the full Ultradesign workflow.

## Actual verification

- Node suite: all 21 tests passed before final bounded comparison/whitespace
  refinements. The affected five diff-engine tests passed again after refinements.
  Includes empty/equal input, Unicode graphemes, whitespace, exact reconstruction
  in both directions, bounded fallback, and 200 randomized document pairs across
  four comparison units.
- Dedicated-page Chromium tests passed at 1280, 390, and 320 pixels after final
  UI refinements. Covers initial state, counts, all units, whitespace toggle,
  two-way hunk merge, undo, full-document merge, difference navigation, literal
  script text, UTF-8 TXT download and no horizontal overflow.
- Preview was generated from the real page with Liquid asset URLs replaced by
  absolute file URLs, minimal box-sizing/container styles and no Jekyll layout.
  Therefore navigation integration and inherited theme styling were inspected
  in source, not proven in a rendered full site.
- Full Jekyll build attempted, failed because bundle could not find jekyll.
- In-app browser connection attempted but native pipe bridge was unavailable.
  Sandboxed Chromium launch also failed; approved headless Chromium execution
  produced the actual integration results and screenshots.
- Viewed desktop empty render and mobile populated render. Independent render
  review inspected all three populated widths and found no clipping/overlap.
  Its mobile density/legibility findings led to shorter mobile editors, larger
  counts and a direct jump to differences. Browser checks passed again afterward.
- JavaScript syntax checks and git diff whitespace check passed.

No external reference research, full OMD copy/type/composition gates, final OMD
check, full-site navigation test, or live deployment is claimed. Clipboard API
success depends on browser permission; a manual selection fallback is implemented
but not exercised by this browser test. Text is not uploaded or persisted.
