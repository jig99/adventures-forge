import { getStore } from '@netlify/blobs';

// One shared store for every character, so the DM (and players) can
// see and edit the whole party from any device.
const STORE_NAME = 'forge-characters';

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'invalid JSON' }, { status: 400 });
  }

  const { action, key, value, prefix } = body;
  const store = getStore(STORE_NAME);

  try {
    if (action === 'get') {
      const val = await store.get(key, { type: 'text' });
      if (val === null) return Response.json({ error: 'not found' }, { status: 404 });
      return Response.json({ key, value: val });
    }

    if (action === 'set') {
      await store.set(key, value);
      return Response.json({ key, value });
    }

    if (action === 'delete') {
      await store.delete(key);
      return Response.json({ key, deleted: true });
    }

    if (action === 'list') {
      const { blobs } = await store.list({ prefix: prefix || '' });
      return Response.json({ keys: blobs.map((b) => b.key) });
    }

    return Response.json({ error: `unknown action: ${action}` }, { status: 400 });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
};
