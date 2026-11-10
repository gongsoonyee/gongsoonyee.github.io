# Decisions

What was built is in the code. Why it was built that way is only here.

## Preserve existing Jekyll/Ruby/Liquid stack

- When: 2026-11-10T02:07:05.393Z
- Point of view: (none set)
- Why: Gemfile, _config.yml, _layouts/default.html and _pages/search.html establish the user repository stack; omd stack misclassifies this non-Node project as greenfield. No scaffold or dependencies needed.

## Use deterministic headless preview fallback

- When: 2026-11-10T02:07:06.131Z
- Point of view: (none set)
- Why: browser-rs --help failed: command not found. Use local reduced-motion render/probe only.

## Design preflight limitations

- When: 2026-11-10T02:08:50.886Z
- Point of view: (none set)
- Why: Browser in-app setup failed with privileged native pipe bridge not available; browser-rs missing. omd-hand stopped on missing composition contract. Implementing bounded existing-blog feature with general repository worker and actual local engine/browser tests; do not claim full OMD design-loop completion.
