# Easy Chantier · Métreur IA — déploiement sur Vercel (v4)

Cette version remplace la précédente (Supabase + Netlify) par une architecture 100% Vercel :
un seul site, une base de données partagée (Vercel KV), et votre clé API Anthropic cachée
côté serveur (elle n'est plus jamais visible dans le navigateur).

Les fichiers `supabase_setup.sql` et `Guide_configuration_temps_reel.md` fournis précédemment
ne sont **plus utilisés** — ignorez-les, tout est remplacé par ce dossier.

## Contenu du dossier

```
vercel_app/
  index.html              -> le site (interface)
  package.json             -> dépendance @vercel/kv
  api/
    state.js               -> lecture/écriture des données partagées (clients, lots, métrés)
    analyze-plan.js         -> appelle l'IA Anthropic côté serveur (clé API cachée)
    _utils.js               -> vérification du mot de passe d'espace de travail
```

## Étape 1 — Créer un compte Vercel

Allez sur **vercel.com** → **Sign Up** → connectez-vous avec GitHub (le plus simple), Google, ou email.

## Étape 2 — Mettre ce dossier sur GitHub

Vercel déploie à partir d'un dépôt Git (pas de glisser-déposer possible ici, car il y a plusieurs
fichiers + du code serveur).

1. Allez sur **github.com** → **New repository** → nommez-le par ex. `easychantier-metreur-ia` → créez-le (peut rester privé).
2. Sur votre ordinateur, dans le dossier `vercel_app` fourni, exécutez :
   ```
   git init
   git add .
   git commit -m "Easy Chantier Métreur IA v4"
   git branch -M main
   git remote add origin https://github.com/VOTRE-COMPTE/easychantier-metreur-ia.git
   git push -u origin main
   ```
   (Remplacez l'URL par celle de votre dépôt. Si vous ne connaissez pas Git, GitHub propose aussi
   d'importer des fichiers directement depuis son interface web : bouton **uploading an existing file**
   sur la page du nouveau dépôt.)

## Étape 3 — Importer le projet dans Vercel

1. Dans le tableau de bord Vercel, cliquez **Add New** → **Project**.
2. Choisissez **Import Git Repository**, sélectionnez le dépôt `easychantier-metreur-ia`.
3. Vercel détecte automatiquement le projet (pas de framework particulier — laissez les réglages
   par défaut). Cliquez **Deploy**. Le premier déploiement échouera probablement car il manque
   la base de données et les variables d'environnement — c'est normal, on les ajoute ensuite.

## Étape 4 — Créer la base de données (Vercel KV)

1. Dans votre projet Vercel, onglet **Storage** → **Create Database** → choisissez **KV** (Upstash Redis).
2. Donnez-lui un nom (ex: `easychantier-kv`), choisissez une région proche, créez-la.
3. Sur l'écran suivant, cliquez **Connect Project** et sélectionnez votre projet `easychantier-metreur-ia`.
   Cela ajoute automatiquement les variables d'environnement nécessaires (`KV_REST_API_URL`,
   `KV_REST_API_TOKEN`, etc.) — vous n'avez rien à copier manuellement.

## Étape 5 — Configurer la clé API Anthropic et le mot de passe

1. Dans votre projet Vercel → **Settings** → **Environment Variables**.
2. Ajoutez :
   - `ANTHROPIC_API_KEY` = votre clé API Anthropic (`sk-ant-...`), la même que vous utilisiez avant
     dans les Paramètres du site. Récupérable sur **console.anthropic.com** → **API Keys**.
   - `SITE_PASSWORD` = un mot de passe de votre choix (ex: `EasyChantier2026!`), que vous et Hugues
     utiliserez pour ouvrir l'outil. Choisissez quelque chose de simple à se rappeler mais pas évident à deviner.
3. Cliquez **Save** pour chacune.

## Étape 6 — Redéployer

1. Onglet **Deployments** → sur le dernier déploiement (celui qui avait échoué), cliquez les
   **...** → **Redeploy**. (Les nouvelles variables d'environnement et la base KV ne sont prises
   en compte qu'après un redéploiement.)
2. Une fois le déploiement en vert ("Ready"), Vercel vous donne une adresse du type
   `https://easychantier-metreur-ia.vercel.app`. C'est votre site.

## Étape 7 — Utilisation avec Hugues

1. Envoyez à Hugues l'adresse du site (`https://...vercel.app`) et le mot de passe (`SITE_PASSWORD`
   défini à l'étape 5).
2. Chacun ouvre l'adresse dans son navigateur, saisit le mot de passe une fois (demandé au premier
   chargement) — c'est tout. Toutes les données (clients, lots, métrés, catalogue) sont ensuite
   synchronisées automatiquement entre vous deux, avec un léger délai (quelques secondes), sans rien
   configurer de plus.
3. Personne n'a besoin de saisir de clé API Anthropic : elle est déjà configurée côté serveur pour tout le monde.

## Personnaliser l'adresse (optionnel)

Dans **Settings** → **Domains** de votre projet Vercel, vous pouvez ajouter un nom de domaine
personnalisé, ou changer le sous-domaine `.vercel.app` proposé par défaut.

## Mettre à jour le site plus tard

Si l'outil évolue (nouvelle version des fichiers), remplacez les fichiers dans votre dépôt GitHub
(ou faites un nouveau `git push`) — Vercel redéploie automatiquement à chaque `push` sur la branche
`main`. Vos données, elles, restent intactes puisqu'elles vivent dans Vercel KV, pas dans les fichiers.

## Sécurité — à savoir

- `SITE_PASSWORD` est un mot de passe **partagé** simple (comme une porte d'entrée commune) : toute
  personne qui le connaît peut lire/modifier toutes les données. Adapté à un usage interne entre
  collègues de confiance, pas à une diffusion publique — ne le partagez qu'avec les personnes concernées.
- Si vous voulez retirer l'accès à quelqu'un, il suffit de changer `SITE_PASSWORD` dans les variables
  d'environnement Vercel puis de redéployer — l'ancien mot de passe cesse alors de fonctionner pour tout le monde,
  il faudra alors redistribuer le nouveau à ceux qui doivent garder l'accès.
