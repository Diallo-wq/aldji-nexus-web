# Configuration Firebase pour OMEX

## 🚀 Guide de Configuration Firebase

### 1. Créer un projet Firebase

1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Cliquez sur "Créer un projet"
3. Donnez un nom à votre projet (ex: "omex-gestion-commerciale")
4. Suivez les étapes de configuration

### 2. Activer Authentication

1. Dans votre projet Firebase, allez dans "Authentication"
2. Cliquez sur "Commencer"
3. Dans l'onglet "Sign-in method", activez "Email/Password"
4. Cliquez sur "Enregistrer"

### 3. Activer Firestore Database

1. Dans votre projet Firebase, allez dans "Firestore Database"
2. Cliquez sur "Créer une base de données"
3. Choisissez "Mode de test" pour le développement
4. Sélectionnez l'emplacement de votre base de données
5. Cliquez sur "Terminé"

### 4. Récupérer les clés de configuration

1. Dans les paramètres du projet (icône engrenage)
2. Allez dans "Paramètres du projet"
3. Dans l'onglet "Général", faites défiler jusqu'à "Vos applications"
4. Cliquez sur l'icône web (</>) pour ajouter une application web
5. Donnez un nom à votre application (ex: "OMEX Web")
6. Copiez la configuration Firebase

### 5. Mettre à jour la configuration

1. Ouvrez le fichier `src/services/firebase.ts`
2. Remplacez la configuration par défaut par vos clés :

```typescript
const firebaseConfig = {
  apiKey: "votre-api-key-ici",
  authDomain: "votre-projet.firebaseapp.com",
  projectId: "votre-projet-id",
  storageBucket: "votre-projet.appspot.com",
  messagingSenderId: "votre-sender-id",
  appId: "votre-app-id"
};
```

### 6. Règles Firestore (Optionnel)

Pour la production, configurez les règles Firestore dans `Firestore Database > Règles` :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permettre l'accès aux utilisateurs authentifiés
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Permettre l'accès aux produits pour les utilisateurs authentifiés
    match /products/{productId} {
      allow read, write: if request.auth != null;
    }
    
    // Permettre l'accès aux ventes pour les utilisateurs authentifiés
    match /sales/{saleId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 7. Test de la configuration

1. Lancez l'application : `npm run web`
2. Testez l'inscription avec un email et mot de passe
3. Vérifiez dans Firebase Console que l'utilisateur a été créé
4. Testez la connexion

### ⚠️ Notes importantes

- **Ne jamais commiter les vraies clés Firebase** dans un repository public
- Utilisez des variables d'environnement pour la production
- Configurez les règles Firestore appropriées pour la sécurité
- Testez toujours l'authentification avant de déployer

### 🔧 Variables d'environnement (Recommandé)

Pour une meilleure sécurité, utilisez des variables d'environnement :

1. Créez un fichier `.env` :
```
FIREBASE_API_KEY=votre-api-key
FIREBASE_AUTH_DOMAIN=votre-projet.firebaseapp.com
FIREBASE_PROJECT_ID=votre-projet-id
FIREBASE_STORAGE_BUCKET=votre-projet.appspot.com
FIREBASE_MESSAGING_SENDER_ID=votre-sender-id
FIREBASE_APP_ID=votre-app-id
```

2. Installez `react-native-dotenv` :
```bash
npm install react-native-dotenv
```

3. Mettez à jour `firebase.ts` :
```typescript
import {
  FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID
} from '@env';

const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: FIREBASE_AUTH_DOMAIN,
  projectId: FIREBASE_PROJECT_ID,
  storageBucket: FIREBASE_STORAGE_BUCKET,
  messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
  appId: FIREBASE_APP_ID
};
```

---

**OMEX** - Configuration Firebase complète ✅
