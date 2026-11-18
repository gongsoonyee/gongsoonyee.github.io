# Blog Topics addition

User approved a whole-blog Topics directory, a compact home entry, desktop theme
index, mobile theme accordions, and related-post links. Existing Jekyll/Liquid
stack retained. Current reading groups and recommended order retained, with Intro
added to the introduction subgroup. This is a bounded existing-blog extension;
no full Ultradesign certification or external reference measurements are claimed.

## Executed evidence before deployment

- Inspected actual index, reading data/includes, post layout, default layout,
  existing reading styles, post filenames and front matter, and Intro content.
- Python/YAML validation: 17 posts each assigned exactly once, no stale slugs,
  unique theme and group anchors.
- Actual Liquid templates rendered using a temporary LiquidJS installation,
  with Jekyll-style includes and URL/where filters, actual data/front matter and
  existing default layout. This is template QA, not a full Jekyll build.
- Rendered home topics, all-topic index, three related-post/series variants and
  an extra unclassified-post fixture. Checked no unresolved template syntax or
  duplicate DOM ids; fallback fixture exposes the extra post; related links and
  existing recommended-series links resolve to their intended anchors/slugs.
- Browser tests passed at 1280, 390 and 320 px: complete/unique post listing,
  Topics current navigation, theme links, pointer/keyboard native details,
  deep links, mobile initialization and no horizontal overflow. All posts stay
  available with JavaScript disabled. Tests repeated after final visual fixes.
- Local screenshots used the existing screen.css, deployed current main.css,
  and Bootstrap plus new topics.css. Desktop and mobile renders were viewed;
  independent render-only reviewer found no clipping or overlap, recommending
  better mobile metadata contrast/density. Metadata darkened, mobile dates
  enlarged and row padding reduced; tests passed again.
- In-app browser bootstrap failed with native pipe bridge unavailable; approved
  headless Chromium used for actual browser tests. No browser authentication
  was bypassed. Tests and temporary dependencies did not change runtime deps.
- JavaScript syntax and git diff whitespace checks passed.

Existing uncommitted coding-agent article edits are excluded from deployment.

Before push, remote c7f0f2e added BOJ is Back. Read its actual content,
merged the remote commit and classified the new post in study-essays. Existing
article working edits remained untouched. Coverage rechecked for all 17 posts.
