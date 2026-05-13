# 📋 Implémentation Vocablingo — Reste à faire

État au **11 mai 2026**. Voir [README.md](./README.md) pour la vision produit.

---

## 🎯 Priorité haute — Impact UX immédiat

### 1. Vrai mode "Apprentissage" (flashcards)

**Problème** : `src/screens/LearningScreen.tsx` affiche juste un aperçu de 5 mots avant d'envoyer aux exercices. L'utilisateur n'a aucune phase de découverte du mot.

**À faire** :
- [ ] Phase flashcard avant les exercices : montrer chaque mot avec définition, exemples, synonymes, antonymes
- [ ] Boutons "Suivant" / "Je connais déjà"
- [ ] Marquer le mot comme "vu" dans `user_progress` (initialiser via `initializeWordProgress`)
- [ ] Ajouter une `ProgressBar` pour suivre l'avancée dans le thème

**Fichiers concernés** : `src/screens/LearningScreen.tsx`, nouveau composant `src/components/VocabCard.tsx`

---

### 2. Composants réutilisables

**Problème** : `src/components/` est vide. Tout le styling est inline dans les screens, code dupliqué.

**À faire** :
- [ ] `VocabCard.tsx` — carte affichant un mot avec définition, exemples, synonymes/antonymes
- [ ] `ProgressBar.tsx` — barre de progression réutilisable (utilisée dans Home, Exercise, Themes)
- [ ] `ThemeCard.tsx` — carte de thème (actuellement inline dans `ThemesScreen`)
- [ ] `ExerciseCard.tsx` — wrapper pour les exercices (currently inline dans `ExerciseScreen`)
- [ ] `StatCard.tsx` — carte statistique réutilisable (`ProgressScreen` + `HomeScreen`)

**Bénéfice** : -200 à -300 lignes de duplication, design cohérent.

---

### 3. Exercice `identify_nuance`

**Problème** : Type déclaré dans `src/types/index.ts:49` mais aucune implémentation dans `generateExercise()` (`exercises.ts:42-54`). Pourtant un des thèmes principaux du produit.

**À faire** :
- [ ] Enrichir le schéma : ajouter un champ `nuance_with` dans `Word` pour spécifier les paires de mots à nuance (ex. observer/contempler)
- [ ] Implémenter `generateIdentifyNuance()` : "Lequel des deux mots convient le mieux dans cette phrase ?"
- [ ] Ajouter au cycle dans `generateExercises()` (alterner les 5 types)
- [ ] Ajouter ~5-10 mots du thème "Nuances lexicales" avec paires définies

**Fichiers concernés** : `src/services/exercises.ts`, `src/types/index.ts`, `src/data/vocabulary.json`

---

### 4. Écran Achievements / Trophées

**Problème** : 9 achievements définis dans `src/services/gamification.ts:51-124`, la logique de déblocage marche, mais aucun écran pour les consulter.

**À faire** :
- [ ] Nouveau screen `AchievementsScreen.tsx`
- [ ] Afficher les achievements débloqués (en couleur) et verrouillés (en gris avec critère)
- [ ] Ajouter route dans `AppNavigator.tsx`
- [ ] Bouton d'accès depuis `HomeScreen` ou `ProgressScreen`
- [ ] Notification visuelle (toast/modal) au déblocage d'un achievement après un exercice

---

## 🎮 Priorité moyenne — Engagement

### 5. Animations feedback

**Problème** : Zéro `Animated` dans le code. UX plate vs Duolingo.

**À faire** :
- [ ] Confettis sur bonne réponse (lib : `react-native-confetti-cannon`)
- [ ] Shake animation sur mauvaise réponse (`Animated.sequence`)
- [ ] Animation level-up (modal avec scale/fade)
- [ ] Transitions fluides entre questions (slide)
- [ ] Animation de la `ProgressBar` (interpolation au lieu de width statique)

**Fichiers concernés** : `src/screens/ExerciseScreen.tsx`, composants à créer

---

### 6. Objectif quotidien

**Problème** : Streak existe mais aucun objectif tangible "X exercices/mots par jour".

**À faire** :
- [ ] Ajouter `daily_goal` dans `user_stats` (défaut: 5 exercices)
- [ ] Ajouter `daily_progress_count` + `daily_progress_date` pour reset à minuit
- [ ] Widget sur `HomeScreen` : "3/5 exercices aujourd'hui" avec progress bar
- [ ] Confettis + XP bonus à l'atteinte de l'objectif
- [ ] Setting pour personnaliser l'objectif (5/10/20/50)

---

### 7. Écran détails par mot

**Problème** : Aucune page pour consulter en détail un mot avec son historique. Frustrant en révision.

**À faire** :
- [ ] Nouveau screen `WordDetailScreen.tsx`
- [ ] Affiche : définition, tous les exemples, synonymes, antonymes
- [ ] Stats individuelles : taux de réussite, dernière révision, prochaine révision, niveau de maîtrise
- [ ] Bouton "Pratiquer ce mot maintenant"
- [ ] Accessible depuis `LearningScreen` (sur clic d'un mot) et `ProgressScreen`

---

### 8. Audio / prononciation (TTS)

**Problème** : Pas d'audio. Crucial pour apprendre la prononciation française.

**À faire** :
- [ ] Installer `expo-speech`
- [ ] Bouton "🔊" sur `VocabCard` et `ExerciseScreen` pour entendre le mot
- [ ] Lecture automatique optionnelle (setting)
- [ ] Configurer voix française (`fr-FR`)

---

## 📚 Contenu et polish

### 9. Plus de vocabulaire

**Problème** : ~60 mots actuellement. Objectif README : 2000+.

**À faire** :
- [ ] Cible intermédiaire : 200 mots (5x plus)
- [ ] Étoffer chaque thème existant :
  - Vocabulaire professionnel : +20 mots
  - Expressions idiomatiques : +20 mots
  - Nuances lexicales : +15 mots (avec paires)
  - Registres de langue : +15 mots (avec équivalents)
  - Émotions : +15 mots
- [ ] Ajouter 2-3 nouveaux thèmes : Argumentation, Culture/Société, Description

**Fichier** : `src/data/vocabulary.json`

---

### 10. Recherche dans le vocabulaire

**Problème** : Pas de moyen de chercher un mot.

**À faire** :
- [ ] Barre de recherche dans `ThemesScreen` ou nouveau `SearchScreen`
- [ ] Recherche full-text : `expo-sqlite` supporte FTS5 (activé via `enableFTS: true` dans `app.json` — déjà fait !)
- [ ] Ajouter une migration SQL pour créer une table FTS5 indexant `word + definition + examples`
- [ ] Naviguer vers `WordDetailScreen` au clic

---

### 11. Mode sombre

**À faire** :
- [ ] Définir une palette dark (constants)
- [ ] Context `ThemeContext` (clair/sombre/system)
- [ ] Refactoriser tous les styles pour utiliser le context
- [ ] Toggle dans un futur écran Settings
- [ ] Persister le choix via `AsyncStorage`

---

### 12. Tests

**Problème** : Zéro test.

**À faire** :
- [ ] Setup `jest-expo`
- [ ] Tests unitaires prioritaires :
  - `services/srs.ts` — `calculateNextReview`, `getQualityFromAnswer`
  - `services/gamification.ts` — `calculateLevel`, `updateStreak`, `checkAchievements`
  - `services/exercises.ts` — `generateExercises`, `calculateScore`
- [ ] Tests d'intégration : flux complet `Exercise` → `database` → `srs`

---

## 🔧 Dette technique

- [ ] Migrer React Navigation v6 → v7 (v6 en fin de support)
- [ ] Ajouter un `SettingsScreen` (mode sombre, objectif quotidien, TTS auto, reset progress)
- [ ] Gérer le reset du streak en arrière-plan (BackgroundFetch ou check au démarrage)
- [ ] Migration de base de données : ajouter un système de versioning des migrations pour les futures évolutions de schéma
- [ ] Logger centralisé (remplacer les `console.error` éparpillés)
- [ ] Splash screen et icône d'app (actuellement par défaut Expo)

---

## 📊 Suivi global

| Phase | Fonctionnalité | État |
|-------|---------------|------|
| 1 | Infrastructure | ✅ |
| 2 | Base de données | ✅ |
| 3 | SRS (SM-2) | ✅ |
| 4 | Navigation & écrans | ✅ |
| 5 | Apprentissage (flashcards) | ⚠️ Partiel |
| 6 | Exercices | ⚠️ 4/5 types |
| 7 | Révision | ✅ |
| 8 | Gamification | ⚠️ Logique OK, UI/animations manquantes |
| 9 | Tests & déploiement | ❌ |

---

## 🚀 Ordre d'attaque recommandé

**Sprint 1 — Fonctionnel** (impact utilisateur max)
1. Vrai mode flashcards (#1)
2. Composants réutilisables (#2)
3. Exercice `identify_nuance` (#3)
4. Écran Achievements (#4)

**Sprint 2 — Engagement**
5. Animations (#5)
6. Objectif quotidien (#6)
7. Détails par mot (#7)
8. Audio TTS (#8)

**Sprint 3 — Contenu & polish**
9. +140 mots (#9)
10. Recherche (#10)
11. Mode sombre (#11)
12. Tests (#12)
