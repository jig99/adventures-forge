// ============================================================
// window.storage shim  —  backed by Netlify Blobs (server-side)
// ------------------------------------------------------------
// Every read/write goes to a Netlify Function (netlify/functions/
// storage.js), which stores data in a single SHARED Netlify Blobs
// store. That means characters persist on Netlify and show up on
// EVERY device — so you (the DM) can open the site anywhere, see
// the whole party, and edit anyone's character.
//
// The method names and return shapes match the artifact storage
// API exactly, so you do NOT change any code inside the Forge.
// This just has to load before the component mounts (main.jsx
// imports it first).
//
// Note: the `shared` flag is ignored on purpose — everything goes
// to the one shared store so the party is visible to everyone.
// ============================================================

const ENDPOINT = '/.netlify/functions/storage';

async function call(payload) {
  return fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

window.storage = {
  // Throws if the key doesn't exist (matches the artifact API).
  async get(key, shared = false) {
    const res = await call({ action: 'get', key });
    if (res.status === 404) throw new Error(`storage: key not found "${key}"`);
    if (!res.ok) throw new Error(`storage get failed: ${res.status}`);
    const data = await res.json();
    return { key, value: data.value, shared };
  },

  async set(key, value, shared = false) {
    const res = await call({ action: 'set', key, value });
    if (!res.ok) throw new Error(`storage set failed: ${res.status}`);
    return { key, value, shared };
  },

  async delete(key, shared = false) {
    const res = await call({ action: 'delete', key });
    if (!res.ok) throw new Error(`storage delete failed: ${res.status}`);
    return { key, deleted: true, shared };
  },

  async list(prefix = '', shared = false) {
    const res = await call({ action: 'list', prefix });
    if (!res.ok) throw new Error(`storage list failed: ${res.status}`);
    const data = await res.json();
    return { keys: data.keys, prefix, shared };
  },
};
