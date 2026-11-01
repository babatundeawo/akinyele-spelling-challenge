# build

`build.mjs` assembles the pages from `partials/`, pre-renders lists, writes the sitemap, robots file, manifest and service worker (`sw.template.js`), and checks internal links. `check.mjs` runs quality checks on the result. Both run in GitHub Actions and have no dependencies.
