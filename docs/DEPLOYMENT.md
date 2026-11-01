# Deployment guide

This guide is for the site owner. You never need a terminal. Everything is done on the GitHub website.

## How it works

Whenever a change is saved (committed) to the `main` branch, GitHub automatically builds the site, checks it, and publishes it. This takes about one to two minutes. Nothing else is needed.

## One-time setup

1. Open the repository on github.com.
2. Select **Settings** (top row of tabs).
3. In the left menu select **Pages**.
4. Under **Build and deployment**, find **Source** and choose **GitHub Actions**.
5. You should see no Save button. The choice is saved automatically.

## Update the content

1. In the repository, open the file you want to change. Page text is in the `.html` files; names and lists are in the `data` folder.
2. Select the **pencil icon** (Edit this file) at the top right of the file.
3. Make your change.
4. Select **Commit changes...** (green button), then **Commit changes** again.
5. Check that it succeeded (next section).

Photos: upload a new picture with **Add file > Upload files** inside `assets/img`. See [CUSTOMIZING.md](CUSTOMIZING.md).

## Check that a deployment worked

1. Select the **Actions** tab.
2. Open the newest row named **Deploy site**.
3. A **green tick** means the site is live. A **red cross** means something failed and the previous version is still live. A yellow circle means it is still working.

## Read an error

1. On the **Actions** tab, select the run with the red cross.
2. Select the red **build** box on the left.
3. Select the step with the red cross (for example **Build the site**) to open its text.
4. Read the last few lines. They name the file and the problem, for example `about.html: broken reference "assets/img/photo.webp"` means a picture is missing or misspelled.
5. Fix the named file the same way as in "Update the content". The site rebuilds automatically.

## Go back to an earlier version

1. Open the **Code** tab and select **commits** (the clock icon with a number).
2. Find the change you want to undo and open it.
3. Select the **...** menu at the top right, then **Revert**.
4. Select **Create pull request**, then **Merge pull request**, then **Confirm merge**.
5. The site rebuilds with the earlier content. Nothing is ever lost, because every version stays in the history.

## Review and merge the redesign pull request

GitHub Pages cannot show a private preview of a pull request, so the live site changes only when you merge.

1. Open the **Pull requests** tab and select the redesign pull request.
2. Scroll to the checks at the bottom. Wait for a green tick on **Check pull request**.
3. Select **Merge pull request**, then **Confirm merge**.
4. Watch the **Actions** tab until **Deploy site** shows a green tick, then open the live site.
5. If anything looks wrong, use "Go back to an earlier version" above. To discard the redesign instead, select **Close pull request**.

## Use your own domain (optional)

1. In **Settings > Pages**, type your domain under **Custom domain** and select **Save**.
2. At your domain provider's DNS settings, add four **A** records for the main domain pointing to `185.199.108.153`, `185.199.109.153`, `185.199.110.153` and `185.199.111.153`. For a `www` name, add a **CNAME** record pointing to `babatundeawo.github.io`.
3. When GitHub shows the domain as ready, tick **Enforce HTTPS**.
4. Go to **Settings > Secrets and variables > Actions > Variables > New repository variable**. Name: `SITE_URL`. Value: your address with a trailing slash, for example `https://example.com/`. This keeps search-engine addresses and the sitemap correct.
5. Open the **Actions** tab, choose **Deploy site**, then **Run workflow**.

## Turn on secret scanning (recommended)

1. **Settings > Code security** (or **Advanced Security**).
2. Switch on **Secret scanning** and **Private vulnerability reporting**.

## Install the site as an app and test offline use

On Android (Chrome): open the live site, wait a few seconds, then tap **Install the app** at the bottom of the page, or the browser menu (three dots) and **Install app**. Tap **Install**. The icon appears on your Home Screen.

On iPhone or iPad (Safari only): open the live site in Safari, tap the **Share** button, scroll down, tap **Add to Home Screen**, then **Add**. The footer button **Install the app** shows the same steps.

To test offline use: open a few pages while connected, switch on airplane mode, then open the app again. Pages you have visited, the spelling trainer and the word bank still work. A page you never opened shows the "You are offline" page.

When you publish a change, visitors who already have the app see a bar saying **A new version of the site is ready** with a **Refresh** button. Nobody is stuck on an old version.
