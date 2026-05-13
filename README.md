# Vocablingo 🇫🇷

Application mobile Android d'apprentissage de vocabulaire français avancé, inspirée de Duolingo.

## 📋 Description

Vocablingo est une application d'apprentissage conçue pour les francophones avancés qui souhaitent enrichir leur vocabulaire et améliorer leur expression orale. L'application utilise un système de répétition espacée (SRS) basé sur l'algorithme SuperMemo 2 pour optimiser la mémorisation à long terme.

**Public cible** : Personnes parlant couramment français (niveau B2+) souhaitant maîtriser un vocabulaire plus sophistiqué et nuancé.

## ✨ Fonctionnalités

### MVP (Version Initiale)
- **Apprentissage par thèmes** : 4 catégories de vocabulaire
  - Vocabulaire professionnel
  - Expressions idiomatiques
  - Nuances lexicales
  - Registres de langue (soutenu, neutre, familier)

- **Exercices interactifs variés** (style Duolingo)
  - Choix multiples
  - Complétion de phrases
  - Association mot-définition
  - Identification de nuances
  - Vrai/Faux

- **Système de révision intelligent (SRS)**
  - Algorithme SuperMemo 2 (SM-2)
  - Révisions personnalisées selon la performance
  - Optimisation de la rétention à long terme

- **Gamification**
  - Points d'expérience (XP)
  - Streaks quotidiens
  - Niveaux à débloquer
  - Progression par thème

- **Fonctionnement 100% offline**
  - Base de données SQLite locale
  - Aucune connexion Internet requise
  - Toutes les données stockées sur l'appareil

## 🛠️ Stack Technique

- **Framework** : React Native (Expo)
- **Langage** : TypeScript
- **Base de données** : SQLite (expo-sqlite)
- **Navigation** : React Navigation
- **État** : React Context API + AsyncStorage
- **Plateforme cible** : Android

## 📂 Structure du Projet

```
Vocablingo/
├── src/
│   ├── components/           # Composants réutilisables
│   │   ├── VocabCard.tsx
│   │   ├── ExerciseCard.tsx
│   │   ├── ProgressBar.tsx
│   │   └── ThemeCard.tsx
│   ├── screens/             # Écrans de l'application
│   │   ├── HomeScreen.tsx
│   │   ├── ThemesScreen.tsx
│   │   ├── LearningScreen.tsx
│   │   ├── ReviewScreen.tsx
│   │   ├── ExerciseScreen.tsx
│   │   └── ProgressScreen.tsx
│   ├── services/            # Logique métier
│   │   ├── database.ts      # Gestion SQLite
│   │   ├── srs.ts          # Algorithme de répétition espacée
│   │   └── exercises.ts    # Génération d'exercices
│   ├── data/               # Données de vocabulaire
│   │   └── vocabulary.json # Base de ~50 mots
│   ├── types/              # Définitions TypeScript
│   │   └── index.ts
│   └── navigation/         # Configuration navigation
│       └── AppNavigator.tsx
├── assets/                 # Images, icônes, fonts
├── App.tsx                # Point d'entrée
├── app.json              # Configuration Expo
├── package.json
└── tsconfig.json
```

## 🗄️ Schéma de Base de Données

### Table: themes
Stocke les catégories de vocabulaire

| Colonne | Type | Description |
|---------|------|-------------|
| id | INTEGER | Clé primaire |
| name | TEXT | Nom du thème |
| description | TEXT | Description du thème |
| icon | TEXT | Nom de l'icône |
| word_count | INTEGER | Nombre de mots |

### Table: words
Stocke le vocabulaire

| Colonne | Type | Description |
|---------|------|-------------|
| id | INTEGER | Clé primaire |
| word | TEXT | Le mot/expression |
| definition | TEXT | Définition |
| theme_id | INTEGER | Référence au thème |
| examples | TEXT | JSON: exemples de phrases |
| level | TEXT | Niveau (B2, C1, C2) |
| synonyms | TEXT | JSON: liste de synonymes |
| antonyms | TEXT | JSON: liste d'antonymes |

### Table: user_progress
Suivi de la progression utilisateur (SRS)

| Colonne | Type | Description |
|---------|------|-------------|
| id | INTEGER | Clé primaire |
| word_id | INTEGER | Référence au mot |
| easiness_factor | REAL | Facteur de facilité (1.3-2.5) |
| interval | INTEGER | Jours avant révision |
| repetitions | INTEGER | Nombre de répétitions |
| next_review_date | TEXT | Date prochaine révision |
| last_reviewed_date | TEXT | Date dernière révision |
| times_seen | INTEGER | Nombre de fois vu |
| times_correct | INTEGER | Nombre de réponses correctes |

### Table: exercise_history
Historique des exercices

| Colonne | Type | Description |
|---------|------|-------------|
| id | INTEGER | Clé primaire |
| word_id | INTEGER | Référence au mot |
| exercise_type | TEXT | Type d'exercice |
| is_correct | INTEGER | 0 ou 1 |
| timestamp | TEXT | Date/heure |

## 🧮 Algorithme SRS (SuperMemo 2)

L'application utilise l'algorithme SM-2 pour espacer les révisions :

- **Easiness Factor (EF)** : 1.3 à 2.5 (ajusté selon performance)
- **Interval** : Nombre de jours avant prochaine révision
- **Quality** : Note de 0 à 5 selon la réponse

**Logique** :
```
Si réponse correcte (qualité ≥ 3):
  - repetitions++
  - interval = interval × EF

Si réponse incorrecte:
  - repetitions = 0
  - interval = 1 jour

Ajustement EF:
  EF' = EF + (0.1 - (5 - quality) × (0.08 + (5 - quality) × 0.02))
```

## 🎨 Design UI/UX

### Palette de Couleurs
- **Vert** (#58CC02) : Succès, apprentissage
- **Bleu** (#1CB0F6) : Révision
- **Orange** (#FF9600) : Streaks
- **Rouge** (#FF4B4B) : Erreurs
- **Background** : Blanc/Gris clair

### Animations
- Confettis pour réponses correctes
- Shake pour erreurs
- Progress bars fluides
- Transitions douces entre écrans

## 📦 Installation & Développement

### Prérequis
- Node.js (v16+)
- npm ou yarn
- Expo CLI
- Android Studio (pour émulateur) ou appareil Android physique

### Installation

```bash
# Cloner le projet
cd Vocablingo

# Installer les dépendances
npm install

# Lancer l'application
npx expo start
```

### Build Android

```bash
# Build de développement
npx expo run:android

# Build de production (avec EAS)
eas build --platform android
```

## 🎯 Roadmap

### Phase 1 : Infrastructure ✅
- [x] Setup projet React Native/Expo
- [x] Configuration TypeScript
- [x] Structure de dossiers

### Phase 2 : Base de Données
- [ ] Service SQLite
- [ ] Schéma et migrations
- [ ] Fichier vocabulary.json (50 mots)
- [ ] Import JSON → SQLite

### Phase 3 : Système SRS
- [ ] Implémentation algorithme SM-2
- [ ] Service de sélection de révisions
- [ ] Mise à jour de progression

### Phase 4 : Navigation & Écrans
- [ ] Configuration React Navigation
- [ ] HomeScreen
- [ ] ThemesScreen
- [ ] ProgressScreen

### Phase 5 : Apprentissage
- [ ] VocabCard component
- [ ] LearningScreen
- [ ] Logique d'apprentissage

### Phase 6 : Exercices
- [ ] Générateur d'exercices
- [ ] ExerciseCard variants
- [ ] ExerciseScreen
- [ ] Système de scoring

### Phase 7 : Révision
- [ ] ReviewScreen
- [ ] Intégration SRS
- [ ] Mix d'exercices

### Phase 8 : Gamification
- [ ] Système XP et niveaux
- [ ] Streaks quotidiens
- [ ] Animations et feedback
- [ ] Polish UI/UX

### Phase 9 : Tests & Déploiement
- [ ] Tests fonctionnels
- [ ] Tests sur appareil Android
- [ ] Optimisation performance
- [ ] Release APK

## 📚 Contenu Initial

~50 mots répartis sur 4 thèmes :
- **Vocabulaire professionnel** (~15 mots) : éplucher, peaufiner, briefer, arbitrer, piloter...
- **Expressions idiomatiques** (~15 mots) : mettre les points sur les i, tourner autour du pot...
- **Nuances lexicales** (~10 mots) : observer vs contempler, efficace vs efficient...
- **Registres de langue** (~10 mots) : bosser vs travailler vs œuvrer...

## 🚀 Évolutions Futures

- Ajout de vocabulaire (objectif 2000+ mots)
- Défis quotidiens
- Mode multijoueur
- Export/import de progression
- Thème sombre
- Support iOS
- Synchronisation cloud (optionnelle)

## 📄 Licence

Projet personnel - Tous droits réservés

## 👤 Auteur

Développé pour l'apprentissage personnel du vocabulaire français avancé.

---

**Version** : 0.1.0 (MVP en développement)
**Dernière mise à jour** : 11 mai 2026
