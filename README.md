# Three Hands Vintage

A stylish vintage-watch storefront built with Next.js for Vercel. The catalog is backed by `data/watches.json`, seeded from the current Three Hands Vintage shop inventory, and editable through `/admin`.

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Admin

Visit `/admin` to create and edit listings. Each listing includes:

- title, slug, brand, year, price
- quantity and sold-out status
- featured placement
- uploaded product images
- reference, movement, dimensions, service, box/papers, strap
- `hideWhenSold`, which hides sold listings from the storefront when enabled

For local development, if `ADMIN_PASSWORD` is not set, the admin API is open and writes directly to `data/watches.json`.
Uploaded images are saved to `public/uploads`.

## Vercel + GitHub Setup

Set these environment variables in Vercel:

```bash
ADMIN_PASSWORD=choose-a-strong-password
GITHUB_TOKEN=github-fine-grained-token-with-contents-read-write
GITHUB_OWNER=your-github-username-or-org
GITHUB_REPO=your-repo-name
GITHUB_BRANCH=main
```

On Vercel, the serverless admin API commits listing changes to `data/watches.json` and image uploads to `public/uploads` in GitHub, then Vercel can redeploy from those commits. For immediate post-save refreshes, enable Vercel's automatic deployments on GitHub pushes.

## Inventory Notes

The seed catalog uses current live product names, prices, sold-out state, and Big Cartel image URLs from `https://www.threehandsvintage.com`. The first three available listings include richer scraped descriptions and specs; the remaining entries are structured so they can be expanded in the admin.
