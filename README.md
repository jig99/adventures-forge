# The Adventurer's Forge — Netlify-hosted, shared character storage

A Vite + React wrapper for your D&D 5e character creator, hosted on Netlify with
**central, server-side character storage**. Every character is saved to a shared
store on Netlify, so you (the DM) can open the site from any device, see the whole
party, and edit anyone's character.

## The one thing you need to do

Everything is set up except the Forge component itself.

1. Open the **Adventurer's Forge** artifact in Claude.
2. Copy the **entire** artifact code.
3. Open `src/AdventurersForge.jsx`, delete the placeholder, and paste the code in.
4. Keep its default export at the bottom (`export default function App() {...}`).

You do **not** edit any `window.storage` calls. The shim in `src/storage-shim.js`
sends them to a Netlify Function instead.

## How storage works now

- `src/storage-shim.js` recreates `window.storage`, but each call hits
  `netlify/functions/storage.js`.
- That function reads/writes a single **shared Netlify Blobs store**
  (`forge-characters`).
- Result: characters live on Netlify, not in one browser. Open the site on your
  laptop or phone and you see and can edit the same party.

## Deploy to Netlify

Because this uses a Function + Blobs, deploy by **connecting a repo** (drag-and-drop
of a `dist` folder won't include the function):

1. Push this folder to GitHub.
2. Netlify → New site → import the repo.
3. Settings are already in `netlify.toml`:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Functions directory: `netlify/functions`
4. Deploy. Netlify Blobs is enabled automatically for the function — no extra setup.

## Run locally (optional)

Local testing needs the Netlify CLI so the function and Blobs work:

```bash
npm install
npm install -g netlify-cli   # if you don't have it
netlify dev                  # serves the app AND the function together
```

(`npm run dev` alone runs the React app but NOT the function, so saving won't work
in that mode.)

## Good to know

- **One device at a time is safest.** The Forge autosaves the roster, and writes are
  last-write-wins. For a table where you create characters one by one (or you're the
  one editing), this is exactly right. If two people edit different characters at the
  exact same second from different devices, the later save wins.
- **No login.** Anyone with the URL can see/edit the party. Fine for a private group;
  if you want it locked down, add Netlify password protection (Site settings →
  Access control) or share the URL only with your players.
- **Prefer Firestore instead?** You already use it elsewhere — if you'd rather store
  characters in Firestore, the same shim can point at Firestore instead of the
  Netlify Function. Just ask.
