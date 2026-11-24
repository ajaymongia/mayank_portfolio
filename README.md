# Mayank Bharti — Portfolio (ready to deploy)

This folder is the finished website as plain files, plus one small Vercel
function (`api/behance.js`) that keeps the work cards in step with Behance.
There is nothing to install and no build step, so it can go straight onto Vercel.

## Put it online

1. On GitHub, create a new, empty repository (for example `mayank-portfolio-site`).
2. Choose “uploading an existing file” and drag in everything inside this folder.
3. On vercel.com, choose **Add New → Project**, import that repository and
   click **Deploy**. Leave every setting as it is.

## Changing the content later

The editable version, with the admin panel, is the `mayank-portfolio` folder.
Make changes there, run `npm run build`, then copy the files from its `dist/`
folder over the ones here and upload them again.

## Behance sync

The work cards follow Mayank's Behance profile on their own; nothing needs
redeploying when a project is added or removed there.

- `api/behance.js` reads Behance's public RSS feed
  (behance.net/feeds/user?username=mayankbharti2529). Vercel caches the
  answer for an hour, so a new Behance project shows up within about an hour.
- `js/behance-sync.js` runs on the page. It adds a card (title and cover) for a
  project that is new on Behance, removes the card for a project deleted from
  Behance, keeps Behance's order, and updates the "case studies published on
  Behance" number.
- Cards with hand-written text (subtitle, tags) keep it. To give a new project
  its own text, add it in the admin of the `mayank-portfolio` folder, rebuild
  and upload again.
- If Behance is slow or unreachable, the site shows the cards it was built with.

The function only runs on Vercel. Opening `index.html` straight from disk shows
the built cards without syncing.
