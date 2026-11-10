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

`/series/` lists articles by topic. Edit `_data/reading.yml` to change groups or
reading order. Post IDs are the site's existing slug IDs (for example
`/andrej-karpathy-skills`). A group with `sequential: true` adds a series list,
current-article marker and previous/next links below each member article.
Grouping does not change article content, publication dates or URLs.

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
