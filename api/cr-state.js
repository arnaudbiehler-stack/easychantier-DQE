// api/cr-state.js
// Stockage partagé, clé par clé, pour l'outil "Compte rendu de chantier".
// Réutilise le même mot de passe d'espace de travail (SITE_PASSWORD) et la même
// base Vercel KV / Upstash Redis que le reste du site — aucune nouvelle variable
// d'environnement à créer.
//
// GET  /api/cr-state?key=XXX        -> { key, value } | { key, value: null }
// PUT  /api/cr-state  body:{key,value} -> { ok: true }
// Toutes les clés sont préfixées "cr_" côté KV pour ne jamais entrer en collision
// avec les données de l'outil Métreur IA (qui utilise sa propre clé "easychantier_state").

import { kv } from '@vercel/kv';

const KV_PREFIX = 'cr_';

function checkAuth(req) {
  const password = req.headers['x-workspace-password'];
  return !!password && password === process.env.SITE_PASSWORD;
}

export default async function handler(req, res) {
  if (!checkAuth(req)) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }

  try {
    if (req.method === 'GET') {
      const key = req.query.key;
      if (!key) {
        res.status(400).json({ error: 'missing_key' });
        return;
      }
      const value = await kv.get(KV_PREFIX + key);
      res.status(200).json({ key, value: value === undefined ? null : value });
      return;
    }

    if (req.method === 'PUT') {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch (e) { body = {}; }
      }
      const { key, value } = body || {};
      if (!key) {
        res.status(400).json({ error: 'missing_key' });
        return;
      }
      await kv.set(KV_PREFIX + key, value);
      res.status(200).json({ ok: true });
      return;
    }

    if (req.method === 'DELETE') {
      const key = req.query.key;
      if (!key) {
        res.status(400).json({ error: 'missing_key' });
        return;
      }
      await kv.del(KV_PREFIX + key);
      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ error: 'method_not_allowed' });
  } catch (err) {
    res.status(500).json({ error: 'server_error', message: err.message });
  }
}
