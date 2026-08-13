// GET  /api/state  -> { data: <etat complet de l'outil, ou null si rien encore enregistre> }
// PUT  /api/state  -> body { data: <etat complet> } ; enregistre et renvoie { ok: true }
// Toutes les donnees (clients, lots, metres, catalogue) sont stockees dans une seule
// cle Vercel KV ('easychantier_state'), sous forme de JSON. C'est ce qui permet a
// tous les navigateurs connectes au meme mot de passe d'espace de travail de voir
// les memes donnees, en quasi temps reel (voir le polling cote client dans index.html).
const { kv } = require('@vercel/kv');
const { checkAuth } = require('./_utils');

const STATE_KEY = 'easychantier_state';

module.exports = async (req, res) => {
  if (!checkAuth(req, res)) return;

  if (req.method === 'GET') {
    try {
      const data = await kv.get(STATE_KEY);
      res.status(200).json({ data: data || null });
    } catch (err) {
      console.error('[api/state] GET failed:', err);
      res.status(500).json({ error: 'kv_read_failed', message: String(err && err.message || err) });
    }
    return;
  }

  if (req.method === 'PUT' || req.method === 'POST') {
    try {
      const body = req.body && typeof req.body === 'object' ? req.body : JSON.parse(req.body || '{}');
      if (!body || typeof body.data !== 'object') {
        res.status(400).json({ error: 'invalid_body', message: 'Le corps de la requête doit contenir { data: {...} }.' });
        return;
      }
      await kv.set(STATE_KEY, body.data);
      res.status(200).json({ ok: true });
    } catch (err) {
      console.error('[api/state] WRITE failed:', err);
      res.status(500).json({ error: 'kv_write_failed', message: String(err && err.message || err) });
    }
    return;
  }

  res.status(405).json({ error: 'method_not_allowed' });
};
