# ALDJI-NEXUS - Application de Gestion Commerciale

ALDJI-NEXUS est une application mobile et web de gestion commerciale moderne, développée avec React Native (Expo) et **Supabase** (migré de Firebase).

## 🚀 Fonctionnalités

### ✅ Authentification Complète
- ✅ Connexion avec email et mot de passe
- ✅ Inscription avec validation
- ✅ Réinitialisation de mot de passe
- ✅ Gestion des sessions sécurisée avec Supabase Auth
- ✅ Row Level Security (RLS) automatique

### ✅ Interface Utilisateur Moderne
- ✅ Design moderne avec glassmorphism et animations
- ✅ Palette de couleurs : bleu foncé (#1e3a8a) et argenté
- ✅ Interface responsive optimisée pour web et mobile
- ✅ Navigation fluide avec transitions
- ✅ Composants réutilisables et modulaires
- ✅ Layout web dédié avec sidebar et header

### ✅ Architecture Technique Robuste
- ✅ React Native avec Expo
- ✅ TypeScript pour la sécurité des types
- ✅ **Supabase** (PostgreSQL + Auth + API REST)
- ✅ Navigation avec React Navigation
- ✅ Gestion d'état avec Context API
- ✅ Structure modulaire et évolutive
- ✅ CSS moderne avec variables et responsive design

### ✅ Gestion des Données
- ✅ **ProductService** : CRUD complet des produits
- ✅ **CustomerService** : Gestion des clients avec recherche
- ✅ **AuthService** : Authentification sécurisée
- ✅ Base de données PostgreSQL avec schéma optimisé
- ✅ Écoute temps réel des changements

## 📱 Pages et Écrans

### ✅ Authentification
- **LoginScreen** : Connexion avec validation et design moderne
- **SignUpScreen** : Inscription avec validation complète

### ✅ Gestion (Fonctionnelles)
- **DashboardScreen** : Tableau de bord avec statistiques
- **ProductsScreen** : Gestion complète des produits et stock
- **CustomersScreen** : Gestion des clients avec recherche

### 🔄 En Développement
- **SalesScreen** : Gestion des ventes et facturation
- **ReportsScreen** : Rapports et statistiques avancés
- **SettingsScreen** : Paramètres de l'application

## 🛠️ Installation et Configuration

### Prérequis
- Node.js (version 16 ou supérieure)
- npm ou yarn
- Expo CLI
- **Compte Supabase** (remplace Firebase)

### Installation

1. **Cloner le projet**
```bash
git clone <repository-url>
cd ALDJI-NEXUS
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configuration Supabase**
   - Créer un projet sur [supabase.com](https://supabase.com)
   - Récupérer l'URL et la clé anonyme du projet
   - Créer un fichier `.env` dans le dossier ALDJI-NEXUS :
   ```bash
   EXPO_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=votre-cle-anonyme
   ```

4. **Créer le schéma de base de données**
   - Dans votre projet Supabase, aller dans l'éditeur SQL
   - Exécuter le contenu du fichier `supabase-schema.sql`

5. **Lancer l'application**
```bash
# Pour le développement web (recommandé)
npm run web

# Pour le développement mobile
npm run android
npm run ios
```

## 🔧 Configuration Supabase

### Étapes de Configuration

1. **Créer un projet Supabase**
   - Aller sur [Supabase Console](https://supabase.com/dashboard)
   - Créer un nouveau projet
   - Noter l'URL et la clé anonyme

2. **Configurer l'authentification**
   - L'authentification email/mot de passe est activée par défaut
   - Row Level Security (RLS) est configuré automatiquement

3. **Importer le schéma**
   - Utiliser le fichier `supabase-schema.sql` fourni
   - Toutes les tables et politiques de sécurité sont incluses

## 📁 Structure du Projet

```
ALDJI-NEXUS/
├── src/
│   ├── components/          # Composants réutilisables
│   │   ├── Logo.tsx
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── WebLayout.tsx    # Layout web optimisé
│   │   └── index.ts
│   ├── screens/             # Écrans de l'application
│   │   ├── LoginScreen.tsx
│   │   ├── SignUpScreen.tsx
│   │   ├── DashboardScreen.tsx
│   │   ├── ProductsScreen.tsx
│   │   └── CustomersScreen.tsx
│   ├── services/            # Services (Supabase, API)
│   │   ├── supabase.ts      # Configuration Supabase
│   │   ├── authService.ts   # Service d'authentification
│   │   ├── productService.ts # Service des produits
│   │   └── customerService.ts # Service des clients
│   ├── contexts/            # Contextes React
│   │   └── AuthContext.tsx
│   ├── navigation/          # Navigation
│   │   ├── MainNavigation.tsx
│   │   └── ProductsNavigation.tsx
│   ├── types/               # Types TypeScript
│   │   └── index.ts
│   ├── utils/               # Utilitaires et constantes
│   │   └── constants.ts
│   └── hooks/               # Hooks personnalisés
├── web/                     # Fichiers spécifiques web
│   └── index.css           # CSS moderne et responsive
├── assets/                  # Ressources (images, fonts)
├── App.tsx                  # Point d'entrée
├── supabase-schema.sql      # Schéma de base de données
└── package.json
```

## 🎨 Design System Web

### Couleurs
- **Primary** : `#1e3a8a` (Bleu foncé)
- **Primary Light** : `#3b82f6` (Bleu)
- **Secondary** : `#c0c0c0` (Argenté)
- **Background** : `#f8fafc` (Gris très clair)
- **Surface** : `#ffffff` (Blanc)
- **Text** : `#1f2937` (Gris foncé)

### Fonctionnalités Web Modernes
- **Glassmorphism** : Effets de transparence et flou
- **Animations fluides** : Transitions et micro-interactions
- **Layout responsive** : Adaptation automatique desktop/mobile
- **Variables CSS** : Système de design tokens
- **Sidebar collapsible** : Navigation optimisée pour desktop
- **Thème sombre** : Support automatique selon préférences système

## 🚀 Optimisations Web

### Performance
- **GPU acceleration** : Animations optimisées
- **Lazy loading** : Chargement différé des composants
- **CSS variables** : Thème dynamique performant
- **Responsive design** : Breakpoints optimisés

### Accessibilité
- **Focus visible** : Navigation clavier
- **Screen readers** : Support des lecteurs d'écran
- **Contraste** : Respect des standards WCAG
- **Semantic HTML** : Structure sémantique

## 🔒 Sécurité

### Supabase Security
- **Row Level Security (RLS)** : Isolation automatique des données
- **JWT tokens** : Authentification sécurisée
- **Politiques de sécurité** : Contrôle d'accès granulaire
- **HTTPS** : Chiffrement des communications

### Bonnes Pratiques
- **Validation côté client et serveur**
- **Gestion sécurisée des erreurs**
- **Protection contre les injections SQL**
- **Sessions sécurisées**

## 📱 Compatibilité

### Plateformes Supportées
- **Web** : Navigateurs modernes (Chrome, Firefox, Safari, Edge)
- **Mobile** : iOS et Android via Expo
- **Desktop** : Interface optimisée pour écrans larges

### Responsive Breakpoints
- **Mobile** : < 640px
- **Tablet** : 640px - 1024px
- **Desktop** : > 1024px
- **Large Desktop** : > 1280px

## 🚀 Déploiement

### Web
```bash
# Build pour production web
expo build:web
```

### Mobile
```bash
# Build pour production mobile
expo build:android
expo build:ios
```

## 📊 Migration Firebase → Supabase

### ✅ Avantages de Supabase
- **PostgreSQL** : Base de données relationnelle plus puissante
- **API REST automatique** : Endpoints générés automatiquement
- **Row Level Security** : Sécurité au niveau des lignes
- **Interface admin** : Dashboard intuitif
- **Open source** : Code source ouvert
- **Coûts optimisés** : Généralement moins cher

### Services Migrés
- ✅ **AuthService** : Authentification complète
- ✅ **ProductService** : CRUD des produits
- ✅ **CustomerService** : Gestion des clients
- 🔄 **SaleService** : En cours de migration
- 🔄 **DashboardService** : En cours de migration

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 📞 Support

Pour toute question ou problème :
- Consulter la documentation Supabase
- Vérifier les logs de l'application
- Ouvrir une issue sur GitHub

## 🔄 Versions

- **v1.0.0** : Version initiale avec Firebase
- **v1.1.0** : Migration vers Supabase
- **v1.2.0** : Amélioration du design web moderne
- **À venir** : Services de vente et rapports complets

---

**ALDJI-NEXUS** - Votre partenaire de gestion commerciale moderne 🚀

*Développé avec React Native, Expo, TypeScript et Supabase*

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 📞 Support

Pour toute question ou problème :
- Ouvrir une issue sur GitHub
- Contacter l'équipe de développement

## 🔄 Versions

- **v1.0.0** : Version initiale avec authentification
- **À venir** : Gestion complète des produits, ventes, clients, etc.

---

**ALDJI-NEXUS** - Votre partenaire de gestion commerciale moderne 🚀
