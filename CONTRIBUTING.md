# Contributing

Thank you for helping improve the site.

## Report a problem or suggest an idea

1. Go to the [Issues tab](https://github.com/babatundeawo/akinyele-spelling-challenge/issues/new/choose).
2. Choose **Report a problem**, fill in the short form and select **Submit new issue**.

## Propose a change on GitHub (no tools needed)

1. Open the file you want to change and select the pencil icon (**Edit this file**).
2. Make your change, then select **Commit changes** and choose **Create a new branch for this commit and start a pull request**.
3. Wait for the **Check pull request** workflow to show a green tick, then ask a maintainer to review.

Page text lives in the `.html` files in the root folder, word and contestant data in `data/`. See [docs/CUSTOMIZING.md](docs/CUSTOMIZING.md) for details.

## For developers

The site needs Node.js 20 or newer. `npm test` builds into `dist/` and runs the quality checks. There are no dependencies to install. Serve `dist/` with any static file server, because the data files are loaded with `fetch()`.
