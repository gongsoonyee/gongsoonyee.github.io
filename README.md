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

### Daily Tango

The header's **Mini Games → Tango** entry opens `/mini-games/tango/`.
Puzzles change at midnight in **Asia/Seoul**. Progress and hint counts are saved
per date in the current browser; no account or backend is required.

The committed bank (`assets/data/tango.json`) contains 400 independently verified,
unique-solution puzzles for **2026-11-01 through 2027-12-05**. Past dates remain
playable. Extend the bank before its last date; the game does not silently repeat
puzzles after coverage ends.

```sh
node --test tests/tango.test.cjs
```

`node scripts/generate-tango.cjs` deterministically recreates the initial bank.
To extend coverage, increase the generation count while preserving the seed and
start date, then update the expected bank size in the test and rerun it. Preserve
published puzzle order and givens so existing saved games keep the same puzzles.
To change already published puzzles, also migrate the storage version in
`assets/js/tango.js`. The tests independently count solutions for the entire bank.
