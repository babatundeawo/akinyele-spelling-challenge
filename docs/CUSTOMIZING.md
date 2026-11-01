# Customising the site

All changes are made on github.com with the pencil icon (**Edit this file**) and then **Commit changes**.

## Text

Open the page's `.html` file in the root folder (for example `about.html`). The text sits between tags, such as `<p>Your text here.</p>`. Change only the words, not the `<` `>` parts. The top of each file (between the `---` lines) holds the page title and search description.

## Contestants, schools and words

- `data/contestants.json`: one entry per pupil (`no`, `name`, `school`, `class`, `aspiration`). Do not add ages.
- `data/schools.json`: the list of schools. Spelling must match `contestants.json`.
- `data/words.json`: `word`, `category` (A, B or C), and for each word `ipa`, `meaning`, `example`.

Keep the commas and quotation marks exactly as they are in the neighbouring entries.

## Colours

Open `css/style.css`. Near the top, under **2. DESIGN TOKENS**, change the hex values, for example `--accent:#E0A030;` (gold) or `--brand:#0F3D2E;` (green). The block marked `[data-theme="dark"]` holds the dark-mode colours. Keep text and background contrast strong.

## Fonts

Fonts are stored in `assets/fonts` and declared at the top of `css/style.css`. Use only fonts you are licensed to host.

## Images

1. Open `assets/img` and select **Add file > Upload files**. JPEG, PNG or WebP are fine; photos about 900 pixels wide load fastest.
2. Winner photos are `winner-1st.webp`, `winner-2nd.webp` and `winner-3rd.webp` (upload a file with the same name to replace one).
3. To add a gallery photo, add an entry to `data/gallery.json` such as `{ "id": 29, "file": "my-photo.jpeg", "alt": "Describe what the photo shows" }`. Describe the picture for people who cannot see it.

Only files that the site actually uses are published, so unused pictures do not slow the site down.

## App icons and install screenshots

The icons people see on their Home Screen are in `assets/icons` (`icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png`). Replace a file by uploading one with the same name and the same pixel size. The maskable icon needs its picture inside the middle 80 percent, because phones crop its edges. The install-prompt pictures are in `assets/screenshots` (two 1280 by 800, two 540 by 960).

## Social preview image

The picture shown when the link is shared is `assets/og-image.png` (1200 by 630 pixels). Replace it by uploading a file with the same name.
