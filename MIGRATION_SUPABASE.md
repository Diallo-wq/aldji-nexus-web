# Migration Firebase vers Supabase - OMEX

## 🎯 Statut de la Migration

✅ **Complété :**
- Installation des dépendances Supabase
- Configuration du client Supabase 
- Migration du service d'authentification
- Migration du service des produits
- Migration du service des clients  
- Migration du contexte d'authentification
- Création du schéma de base de données SQL

🔄 **En cours :**
- Migration des services de ventes et dashboard
- Tests de l'application

## 📋 Étapes pour Finaliser la Migration

### 1. Créer un Projet Supabase

1. Allez sur [supabase.com](https://supabase.com)
2. Créez un nouveau projet
3. Notez votre URL de projet et votre clé anonyme (anon key)

### 2. Configurer les Variables d'Environnement

Créez un fichier `.env` dans le dossier OMEX avec :
```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Créer le Schéma de Base de Données

1. Dans votre projet Supabase, allez dans l'éditeur SQL
2. Exécutez le contenu du fichier `supabase-schema.sql`
3. Vérifiez que toutes les tables sont créées correctement

### 4. Mettre à Jour les Imports dans l'Application

Remplacez tous les imports Firebase par Supabase dans les fichiers suivants :

#### Dans les écrans :
- `src/screens/ProductsScreen.tsx` : Mettre à jour l'appel ProductService
- `src/screens/DashboardScreen.tsx` : Mettre à jour les services
- `src/screens/CustomersScreen.tsx` : Connecter au vrai service

### 5. Tester l'Application

```bash
npm start
```

## 🔧 Services Migrés

### ✅ AuthService
- Inscription avec Supabase Auth
- Connexion avec Supabase Auth
- Réinitialisation de mot de passe
- Récupération de l'utilisateur actuel

### ✅ ProductService
- CRUD complet avec Supabase
- Gestion des stocks
- Recherche et filtrage
- Écoute temps réel

### ✅ CustomerService  
- CRUD complet avec Supabase
- Recherche par nom avec `ilike`
- Mise à jour des achats
- Écoute temps réel

### 🔄 À Migrer

- `SaleService` : Migration des ventes
- `DashboardService` : Migration des statistiques

## 🚨 Changements Importants

### Signatures des Méthodes
Les méthodes nécessitent maintenant le `userId` :
```typescript
// Avant (Firebase)
ProductService.getAllProducts()

// Après (Supabase)
ProductService.getAllProducts(userId)
```

### Gestion des Erreurs
Supabase retourne des erreurs différemment :
```typescript
// Avant (Firebase)
try {
  // code
} catch (error: any) {
  throw new Error(error.message);
}

// Après (Supabase)
const { data, error } = await supabase.from('table').select();
if (error) throw error;
```

### Row Level Security (RLS)
Toutes les tables ont des politiques RLS activées :
- Les utilisateurs ne peuvent voir que leurs propres données
- Sécurité gérée automatiquement par Supabase

## 🎉 Avantages de Supabase

1. **Base de données PostgreSQL** plus puissante
2. **Interface admin** intuitive
3. **Row Level Security** intégrée
4. **API REST automatique**
5. **Fonctions en temps réel**
6. **Meilleure performance**
7. **Open source**

## 🔍 Prochaines Étapes

1. Finaliser la migration des services restants
2. Tester toutes les fonctionnalités
3. Mettre à jour la documentation
4. Configurer le déploiement
5. Former l'équipe aux nouveaux outils

---

**Note :** Gardez une sauvegarde de votre projet Firebase au cas où vous auriez besoin de revenir en arrière pendant la phase de test.
