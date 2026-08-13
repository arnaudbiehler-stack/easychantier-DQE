// Utilitaires partages par les fonctions serverless.
// checkAuth() verifie le mot de passe de l'espace de travail (SITE_PASSWORD),
// envoye par le navigateur dans l'en-tete "x-workspace-password".
// Si SITE_PASSWORD n'est pas defini cote serveur, l'acces est laisse ouvert
// (pratique en developpement, mais pensez a toujours definir SITE_PASSWORD en production).
function checkAuth(req, res) {
  const expected = process.env.SITE_PASSWORD;
  if (!expected) return true; // pas de mot de passe configure -> acces libre
  const given = req.headers['x-workspace-password'];
  if (given !== expected) {
    res.status(401).json({ error: 'unauthorized' });
    return false;
  }
  return true;
}

module.exports = { checkAuth };
