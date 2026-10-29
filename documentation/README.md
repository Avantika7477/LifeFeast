# LifeQuest documentation (not app runtime)

This folder is **outside** `client/` and `server/`. It holds the documentation source used to build the PDF.

| File | Purpose |
|------|---------|
| `LifeQuest-Documentation.html` | Full documentation content |
| `generate-pdf.mjs` | Rebuilds the PDF using Chrome/Edge on macOS, Windows, or Linux |
| `../LifeQuest-Documentation.pdf` | **Final PDF** at the LifeQuest folder root |

## Regenerate PDF

From the repo root:

```bash
npm run pdf
```

Or:

```bash
cd documentation
npm run pdf
```

The script looks for Google Chrome, Microsoft Edge, Chromium, or Brave. Override with `CHROME_PATH` if needed.

If no browser is found, open `LifeQuest-Documentation.html` in a browser → Print → Save as PDF.
