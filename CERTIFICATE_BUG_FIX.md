# Correction du Bug du Certificat PDF Vierge

## 🎯 Problème Résolu
Quand un apprenant certifié téléchargeait son certificat en PDF, il recevait une **page blanche** au lieu du certificat avec son contenu, ses données personnelles et les styles formatés.

## 🔍 Cause Racine
Le problème venait de l'approche client-side utilisant `html2pdf.js`:

1. **React + dangerouslySetInnerHTML** : Quand vous injectiez une page HTML complète (`<html><head><body>`), React filtrait ces balises
2. **Styles non appliquées** : Les balises `<style>` étaient ignorées par React
3. **Clonage sans styles** : html2pdf clonait un élément DIV sans les styles CSS appliqués
4. **Capture vierge** : html2canvas capturait un élément invisible/non styilisé → PDF blanc

## ✅ Solution Implémentée
Migration vers **génération PDF côté serveur avec Puppeteer** :

### Avantages
- ✓ Rendu HTML/CSS complet et fiable
- ✓ Pas de problèmes avec React et dangerouslySetInnerHTML
- ✓ Images base64 gérées correctement
- ✓ Contrôle total sur les dimensions et le rendu
- ✓ PDFs de qualité production

## 📁 Fichiers Modifiés

### Backend
1. **`backend/src/modules/learners/certificate.service.ts`** (NEW)
   - Service pour générer les certificats PDF
   - Utilise Puppeteer pour la génération côté serveur

2. **`backend/src/modules/learners/learners.controller.ts`**
   - Ajout de la route `POST /learners/certificate/generate`
   - Validation que l'utilisateur est "certifié"
   - Retourne le PDF généré

3. **`backend/src/modules/learners/learners.module.ts`**
   - Enregistrement du CertificateService

### Frontend
1. **`frontend/app/learner/dashboard/page.tsx`**
   - Suppression de la dépendance `html2pdf.js`
   - Modification de `handleDownloadPDF()` pour appeler l'API backend
   - Nettoyage du useEffect qui chargeait le script CDN

2. **`frontend/app/api/learners/certificate/generate/route.ts`** (NEW)
   - Route Next.js qui proxie vers le backend NestJS
   - Gère l'authentification JWT

## 🚀 Flux de Téléchargement Amélioré

```
1. Utilisateur clique "Télécharger mon attestation (PDF)"
   ↓
2. Frontend envoie POST /api/learners/certificate/generate (avec JWT)
   ↓
3. Route Next.js proxie vers backend
   ↓
4. Backend NestJS valide l'utilisateur (JWT + "certifié")
   ↓
5. CertificateService génère le PDF avec Puppeteer:
   - Charge le template HTML
   - Applique les styles CSS
   - Remplace les placeholders (nom, moyenne, code, date)
   - Encode les images en base64
   - Lance Puppeteer pour rendre le HTML
   ↓
6. Retourne le PDF au frontend
   ↓
7. Frontend télécharge le fichier PDF ✓
```

## 🧪 Comment Tester

1. **Démarrer le backend :**
   ```bash
   cd backend
   npm run start:dev
   ```

2. **Démarrer le frontend :**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Accéder au dashboard :**
   - Se connecter avec un apprenant certifié
   - Aller dans "Résultat de l'académie"
   - Entrer le code d'attestation
   - Vérifier le certificat s'affiche bien dans la prévisualisation
   - Cliquer sur "Télécharger mon attestation (PDF)"
   - Vérifier que le PDF contient bien le certificat formaté (pas blanc)

## 📝 Remarques Importantes

- Puppeteer nécessite une version récente de Chrome/Chromium
- En environnement serverless ou Docker, assurez-vous que Puppeteer est bien configuré
- La génération PDF côté serveur garantit une cohérence vis-à-vis de tous les navigateurs clients
- Les images sont maintenant gérées directement par le serveur (plus fiable)

## 🔐 Sécurité

- L'endpoint `/learners/certificate/generate` est protégé par JwtAuthGuard
- Validation que l'utilisateur a le statut "certifié"
- Validation du token JWT avant toute génération

---

**Status:** ✅ Corrigé et testé  
**Approche:** Server-side PDF generation avec Puppeteer  
**Impact:** Zéro impact sur le reste du projet
