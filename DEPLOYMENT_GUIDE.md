# GUIDE DE DÉPLOIEMENT PRODUCTION - ACADÉMIE REEBI

## ÉTAT ACTUEL APRÈS CORRECTIONS

### Problèmes identifiés et corrigés:
1. ✅ Script `start:prod` ajouté à package.json
2. ✅ `ADMIN_ACCESS_CODE` ajouté au validation schema
3. ✅ Erreur TypeScript corrigée (admin-login.dto.ts)
4. ✅ Build local fonctionne correctement

---

## ÉTAPE 1: CONFIGURER RENDER (Backend)

### Variables d'environnement à configurer sur Render:

1. Aller sur: https://dashboard.render.com/web/srv-d814gkj7uimc7381k080
2. Cliquer sur "Environment"
3. Ajouter les variables suivantes:

```
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://postgres:[VOTRE-MOT-DE-PASSE]@db.[VOTRE-PROJET].supabase.co:5432/postgres?schema=public&sslmode=require
JWT_SECRET=reebi_secret_key_2024_change_in_production
JWT_EXPIRATION=1d
ADMIN_ACCESS_CODE=REEBI2026
```

### Pour obtenir DATABASE_URL depuis Supabase:
1. Aller sur https://supabase.com
2. Sélectionner votre projet
3. Aller dans Settings → Database
4. Copier la valeur sous "Connection string"
5. Remplacer `[VOTRE-MOT-DE-PASSE]` par votre mot de passe

### Commandes de déploiement Render:
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm run start:prod`

---

## ÉTAPE 2: CONFIGURER SUPABASE

### Vérifier que les migrations sont exécutées:
1. Se connecter à Supabase
2. Aller dans SQL Editor
3. Exécuter le contenu de `prisma/migrations/20260428142738_init_dynamic_sessions/migration.sql`

### Seed les utilisateurs test:
```sql
INSERT INTO learners (id, "firstName", "lastName", email, identifiant, role, "createdAt", "updatedAt")
VALUES 
  (gen_random_uuid(), 'Jean', 'Dupont', 'jean.dupont@reebi.com', 'JD2024', 'LEARNER', NOW(), NOW()),
  (gen_random_uuid(), 'Marie', 'Martin', 'marie.martin@reebi.com', 'MM2024', 'LEARNER', NOW(), NOW()),
  (gen_random_uuid(), 'Pierre', 'Durand', 'pierre.durand@reebi.com', 'PD2024', 'LEARNER', NOW(), NOW());
```

---

## ÉTAPE 3: CONFIGURER VERCEL (Frontend)

### Variables d'environnement:
1. Aller sur https://vercel.com
2. Sélectionner le projet frontend
3. Aller dans Settings → Environment Variables
4. Ajouter:

```
NEXT_PUBLIC_API_URL=https://academie-reebi-backend.onrender.com
```

5. Redeployer le frontend

---

## ÉTAPE 4: VÉRIFICATION

### Tester le backend:
```bash
# Health check
curl https://academie-reebi-backend.onrender.com/health

# Login apprenant
curl -X POST https://academie-reebi-backend.onrender.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"jean.dupont@reebi.com","identifiant":"JD2024"}'

# Login admin
curl -X POST https://academie-reebi-backend.onrender.com/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"accessCode":"REEBI2026"}'
```

### Comptes de test:
- **Apprenant**: `jean.dupont@reebi.com` / `JD2024`
- **Admin**: Code `REEBI2026`

---

## NOTES IMPORTANTES

### Render Free Plan:
- Le service peut entrer en veille après 15 min d'inactivité
- Le cold start peut prendre 30-60 secondes
- Pour éviter les timeouts sur mobile, considerer Render Pro

### CORS:
- CORS est configuré pour accepter toutes les origines (`origin: '*'`)
- Cela fonctionne pour le frontend Vercel

### Mobile:
- Le timeout sur mobile est probablement dû au cold start Render
- Une fois le backend "réveillé", les requêtes devraient fonctionner

---

## DÉPANNAGE

### Si le backend ne démarre pas:
1. Vérifier les logs sur Render Dashboard
2. Vérifier que DATABASE_URL est correct
3. Vérifier que `npm run build` fonctionne en local

### Si le login échoue:
1. Vérifier que les apprenants existent en base (Supabase)
2. Vérifier que le frontend pointe vers la bonne URL API
3. Vérifier les logs Render pour les erreurs 500

### Si mobile échoue:
1. Attendre le cold start (30-60s)
2. Considérer un plan Render payé pour éviter les timeouts