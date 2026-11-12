# site/

`index.html` is only the page skeleton. `scripts/build.mjs` inlines `css/*.css` and `js/*.js` (in file-name order) into one `dist/index.html`.

| Area | Files |
|---|---|
| Look: theme, hero, tabs, tiles, lists | `css/01-base` to `css/07-list` |
| Motion; view header, back control and panels | `css/08-motion`, `js/11-motion`; `css/09-areas`, `js/12-viewhead` |
| Shared state, matcher, kinds | `js/01-core-matcher.js` (change with care: everything reads it) |
| Domains, places | `js/02-domains-places.js` |
| Sorting and labels | `js/03-sort-labels.js` |
| Tabs and filters | `js/04-tabs-filters.js` |
| Globe and deadline radar | `js/05-hero-globe.js` |
| Researchers, profile, network | `js/06-people.js`, `08-profile.js`, `09-network.js` |
| Sponsor a pulse | `js/07-sponsor.js` |
| Events and start-up | `js/10-events-init.js` |

Check a change with `node scripts/smoke.mjs` (builds, loads the page at desktop and phone width, clicks every tab and dialog). Files load as one script, so top-level names are shared.
