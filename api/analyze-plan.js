// POST /api/analyze-plan
// Body attendu : { pdfBase64: string, promptText: string, model?: string }
// Cette fonction fait office de proxy vers l'API Anthropic : la clé API
// (ANTHROPIC_API_KEY) reste uniquement côté serveur, jamais exposée au navigateur.
// La réponse renvoyée est le JSON brut d'Anthropic (mêmes champs que
// https://api.anthropic.com/v1/messages), pour que le code d'extraction déjà
// présent côté client (extractJson()) fonctionne sans changement.
const { checkAuth } = require('./_utils');

module.exports = async (req, res) => {
  if (!checkAuth(req, res)) return;

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'server_misconfigured', message: "La variable d'environnement ANTHROPIC_API_KEY n'est pas définie sur le serveur." });
    return;
  }

  try {
    const body = req.body && typeof req.body === 'object' ? req.body : JSON.parse(req.body || '{}');
    const { pdfBase64, promptText, model } = body || {};
    if (!pdfBase64 || !promptText) {
      res.status(400).json({ error: 'invalid_body', message: 'pdfBase64 et promptText sont requis.' });
      return;
    }

    const anthropicResp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: model || 'claude-sonnet-4-5-20250929',
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: [
            { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: pdfBase64 } },
            { type: 'text', text: promptText },
          ],
        }],
      }),
    });

    const text = await anthropicResp.text();
    // On repasse tel quel le statut et le corps de la reponse Anthropic (succes ou erreur),
    // pour que le message d'erreur original (ex: cle invalide, credit epuise...) reste lisible.
    res.status(anthropicResp.status);
    res.setHeader('content-type', 'application/json');
    res.send(text);
  } catch (err) {
    console.error('[api/analyze-plan] failed:', err);
    res.status(500).json({ error: 'proxy_failed', message: String(err && err.message || err) });
  }
};
