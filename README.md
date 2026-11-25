# Mediumish - Jekyll Theme

[Live Demo](https://wowthemesnet.github.io/mediumish-theme-jekyll/) &nbsp; | &nbsp; [Download](https://github.com/wowthemesnet/mediumish-theme-jekyll/archive/master.zip) &nbsp; | &nbsp; [Documentation](https://bootstrapstarter.com/template-mediumish-bootstrap-jekyll/) &nbsp; | &nbsp; [Buy me a coffee](https://www.wowthemes.net/donate/)

![mediumish](assets/images/mediumish-jekyll-template.png)


### Copyright

Copyright (C) 2019 Sal, https://www.wowthemes.net

**Mediumish for Jekyll** is designed and developed by [Sal](https://www.wowthemes.net) and it is *free* under MIT license. 

<a href="https://www.wowthemes.net/donate/" target="_blank"><img src="https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png" alt="Buy Me A Coffee" style="height: auto !important;width: auto !important;" ></a>

### Contribute

1. [Fork the repo](https://github.com/wowthemesnet/mediumish-theme-jekyll).
2. Clone a copy of your fork on your local
3. Create a branch off of master and give it a meaningful name (e.g. my-new-mediumish-feature).
4. Make necessary changes, commit, push and open a pull request on GitHub.

Thank you!

### Reading topics and series

The homepage keeps Featured and the original article cards, with a compact
**주제별로 읽기** section linking to **Topics** at `/topics/`. Topics groups the
whole blog by theme and subgroup, using a sticky theme index on desktop and native
accordion sections on mobile. The six most-used tags remain independent filters
on the homepage (ties use latest publication date).

Edit `_data/reading.yml` to change themes, groups and reading order. Each post
belongs to one primary group; `posts` contains slash-prefixed slugs, for example
`/andrej-karpathy-skills`. Entries resolve by `post.slug`, independently of their
date or permalink. Unlisted new posts automatically appear under **아직 분류하지
않은 글**, so adding a post never hides it from Topics. Each theme/group must have
a unique stable `id` for deep links. `/series/` redirects to Topics and preserves
its fragment. A group with `sequential: true` displays recommended reading order
and previous/next links below each member post; other groups show same-topic links.
Post contents, dates and existing URLs are preserved.

```sh
TOPICS_TEST_URL=http://127.0.0.1:4000/topics/ PLAYWRIGHT_MODULE=/path/to/playwright node tests/topics-browser.cjs
```

### Tag relationship graph

`/tags/` keeps its readable tag-and-post list as the default view. Its optional
graph view lays out post and tag nodes in the browser, connected by their
tag relationships. It supports zoom, pan, fit-to-view, node selection, and
direct links to related posts without a separate graph-generation step.
Force controls adjust center strength, repulsion, link strength, and link
distance. Choose force-directed, degree rings, circular, or tag-cluster
layouts to transition smoothly; the rearrange button repeats the selected
layout. In the force-directed layout,
low-degree nodes are biased toward the outside instead of being pulled into
the center. The minimum and maximum node radii are adjustable (6 px and 8 px
by default), with each node's size scaled by its number of connections.

### Daily mini games

The header's **Mini Games** menu opens Tango, Shikaku, or Zip under
`/mini-games/{game}/`. Puzzles change at midnight in **Asia/Seoul**.
Progress and hint counts are saved per game/date in the current browser;
no account or backend is required.

New puzzles are generated in the browser from a stable hash of the game name,
generator version, and ISO date. There is no scheduled bank to replenish.
Solvers check uniqueness during generation; generation uses deterministic work
limits rather than wall-clock timing, so slow and fast devices see the same puzzle.
Past dates regenerate the same puzzle. These are locally authored puzzles,
not puzzles fetched from LinkedIn or another game provider.

Tango retains the already published **2026-11-01 through 2026-11-10** archive
in `assets/data/tango.json`, along with its existing `v1` save keys. From
**2026-11-11**, it uses generator `daily-v1` and separate save keys.
`node scripts/generate-tango.cjs` only reproduces that immutable legacy archive.

```sh
node --test tests/*.test.cjs
```

Browser integration checks use an externally installed Playwright against a local
Jekyll build (no npm runtime dependency is added to the blog):

```sh
PLAYWRIGHT_MODULE=/path/to/playwright node tests/tango-browser.cjs
PLAYWRIGHT_MODULE=/path/to/playwright node tests/grid-games-browser.cjs
```

Keep generator algorithms and their versioned snapshot tests stable. Changing a
generator must introduce a new version with an explicit date cutoff and save-key
migration; never silently change previously published dates. Shikaku and Zip use
`grid-puzzle-engine.js`; Tango uses `tango-engine.js`.

### 2048

`/mini-games/2048/` is a continuous free-play game. Use the focused board's arrow
keys or WASD, swipe on the board, or use the direction buttons. Progress and best
score are stored locally; changing dates does not reset a game. Starting a new
game keeps the best score. After making 2048, choose to continue toward larger
tiles. A successful move spawns one new tile; a move that changes nothing does not.

```sh
PLAYWRIGHT_MODULE=/path/to/playwright node tests/2048-browser.cjs
```

### WorkTools

**WorkTools → Diff Checker** opens `/work-tools/diffchecker/`. Paste plain text
into the two editors to compare words, sentences, graphemes, or lines, optionally
ignoring whitespace. Smart mode aligns Markdown and chapter/section headings,
compares each changed chapter as a whole, and falls back to blank-line-separated
paragraphs when headings are absent. Counts show graphemes with/without whitespace, whitespace-
separated words, and lines. Merge individual differences or the entire document
in either direction; undo retains the latest 50 edits/actions in memory. Copy or
download either document as UTF-8 text. Text is processed locally without upload
or persistent storage. Large comparisons use a coarser replacement region to
bound diff computation. Modern browsers use `Intl.Segmenter` for Korean-aware
segmentation; older browsers fall back to simpler splitting.

```sh
node --test tests/diff-engine.test.cjs
DIFF_TEST_URL=http://127.0.0.1:4000/work-tools/diffchecker/ PLAYWRIGHT_MODULE=/path/to/playwright node tests/diffchecker-browser.cjs
```
