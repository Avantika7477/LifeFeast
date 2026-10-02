# LifeQuest documentation (not app runtime)

This folder is **outside** `client/` and `server/`. It holds the documentation source used to build the PDF.

| File | Purpose |
|------|---------|
| `LifeQuest-Documentation.html` | Full documentation content |
| `generate-pdf.mjs` | Rebuilds the PDF using Chrome/Edge |
| `../LifeQuest-Documentation.pdf` | **Final PDF** at the LifeQuest folder root |

## Regenerate PDF

```bash
cd documentation
npm run pdf
```

Or open `LifeQuest-Documentation.html` in a browser → Print → Save as PDF.
