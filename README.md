# Idea-Book

A notebook for product ideas — capture one in a few seconds, find it again
months later.

## What it does

Write an idea and it is tagged automatically. A keyword map covers the
categories these ideas actually fall into — marketplace, ai/ml, saas, fintech,
health, social, creator, productivity, ecommerce, education, real-estate, api,
hardware, design, music, construction, insurance, mobile — and anything that
matches nothing is just `idea`. Tag colours are derived from the tag string, so
the same tag is always the same colour.

Ideas are grouped by month, searchable across text and tags, and every idea
opens to a full view with its date.

Everything is stored locally in the browser. A JSON export runs automatically
whenever ideas change, and can be re-imported — the importer skips entries you
already have, so restoring a backup never creates duplicates.

Installable as a PWA with a service worker, so it opens and works offline.

## Stack

React 18 · Vite 5 — no backend, no dependencies beyond those.

## Running locally

```sh
npm install
npm run dev
npm run build
```

Deploys to Vercel as a static build (`vercel.json`).

## Layout

| Path | Role |
|---|---|
| `src/App.jsx` | The whole app — capture, tagging, search, detail view |
| `public/sw.js` | Service worker; caches the shell for offline use |
| `public/manifest.json` | PWA install metadata |

## License

Copyright © 2026 Mohit Shukla. All rights reserved.

This repository is made publicly viewable for portfolio and demonstration
purposes only. No license is granted to use, copy, modify, merge, publish,
distribute, sublicense, or sell copies of Idea-Book or any part of
it, in whole or in part, without prior written permission from the
copyright holder.
