# 📋 Implémentation Vocablingo — État

État au **13 mai 2026**. Voir [README.md](./README.md) pour la vision produit.

---

## 🎯 Priorité haute — Impact UX immédiat

### 1. Vrai mode "Apprentissage" (flashcards) ✅

**Fait le 2026-05-13.**

- [x] Phase flashcard avec `VocabCard` (définition, exemples, synonymes, antonymes)
- [x] Boutons "Suivant" / "Je connais déjà" (mots connus filtrés des exercices)
- [x] `initializeWordProgress` idempotent (`INSERT OR IGNORE`)
- [x] `ProgressBar` animée pour suivre l'avancée
- [x] Écran récap (nouveaux / déjà connus) avant exercices

### 2. Composants réutilisables ✅

**Fait le 2026-05-13.**

- [x] `VocabCard`, `ProgressBar` (animée), `ThemeCard`, `StatCard`
- [x] ~~`ExerciseCard`~~ skippé : couplage trop fort avec le state du parent

### 3. Exercice `identify_nuance` ✅

**Fait le 2026-05-13.**

- [x] Champ `nuance_with?: string[]` + colonne migrée via `ensureColumn`
- [x] `generateIdentifyNuance` : définition + 2 options (mot + paire), fallback `multiple_choice`
- [x] Cycle des 5 types
- [x] 10 paires bidirectionnelles dans `vocabulary.json`

### 4. Écran Achievements / Trophées ✅

**Fait le 2026-05-13.**

- [x] `AchievementsScreen` avec sections Débloqués / À débloquer + progress bars individuelles
- [x] Route dans `AppNavigator`
- [x] Bouton orange "🏆 Voir mes trophées" dans `ProgressScreen`
- [x] Notification visuelle dans l'écran de résultats de `ExerciseScreen`

---

## 🎮 Priorité moyenne — Engagement

### 5. Objectif quotidien ✅

**Fait le 2026-05-13.**

- [x] Colonnes `daily_goal`, `daily_progress_count`, `daily_progress_date` (migration `ensureColumn`)
- [x] Helpers `updateDailyProgress` + `getTodayProgress` dans `gamification.ts`
- [x] Widget bleu sur `HomeScreen` avec `ProgressBar` ("X / Y exercices aujourd'hui")
- [x] Bonus XP au franchissement du seuil (DAILY_GOAL_REACHED = 30 XP)
- [x] Setting personnalisable (5/10/20/50) dans `SettingsScreen`
- [x] Confettis à l'atteinte de l'objectif

### 6. Écran détails par mot ✅

**Fait le 2026-05-13.**

- [x] `WordDetailScreen` : définition, exemples, synonymes, antonymes, paires de nuance
- [x] Badge niveau CEFR + badge maîtrise coloré (new/learning/review/mastered)
- [x] Stats individuelles : vu, correct, taux de réussite, prochaine révision, facteur de facilité
- [x] Bouton "Pratiquer ce mot maintenant" → ExerciseScreen avec ce mot
- [x] Accessible via icône ⓘ sur `VocabCard` (flashcards) et résultats de recherche

### 7. Audio / TTS ⏭️

**Skipped sur demande.** À reprendre dans une session dédiée.

- [ ] `expo-speech` + bouton 🔊 sur `VocabCard` et `ExerciseScreen`, voix `fr-FR`

---

## 📚 Contenu et polish

### 8. Plus de vocabulaire — partiel

**État actuel** : **1124 mots / 15 thèmes** (+24 mots ajoutés le 2026-05-13).

Distribution CEFR : B1 ~445, B2 ~430, C1 ~210, C2 ~47.

**Reste à faire pour atteindre 2000+** :
- [ ] +500 mots minimum (les thèmes Santé / Éducation / Économie sont à 65 mots)
- [ ] Ajouter des thèmes (Argumentation, Histoire, Philosophie, Médias)
- [ ] Enrichir `Nuances lexicales` avec 15-25 paires `nuance_with` supplémentaires

### 9. Recherche dans le vocabulaire ✅

**Fait le 2026-05-13.**

- [x] Table virtuelle FTS5 (`words_fts`) avec triggers de sync (insert/update/delete)
- [x] Tokenizer `unicode61 remove_diacritics 1` (recherche accent-insensible)
- [x] Backfill automatique au premier démarrage si la FTS est vide
- [x] `searchWords(query, limit)` avec prefix-match
- [x] `SearchScreen` avec input + debounce 200ms → `WordDetailScreen` au clic
- [x] Pill "🔍 Rechercher un mot…" sur `HomeScreen`

### 10. Mode sombre ✅

**Fait le 2026-05-13.**

- [x] `src/theme/colors.ts` : palettes `lightColors` / `darkColors` (~25 keys sémantiques)
- [x] `src/theme/ThemeContext.tsx` : provider + hook `useTheme()` + persistance `theme_preference`
- [x] Tous les screens et composants refactorés en `makeStyles(c: Colors)` dynamique
- [x] `SettingsScreen` : sélecteur 3 modes (Système / Clair / Sombre) + personnalisation objectif quotidien + reset progression
- [x] `NavigationContainer` themé (DefaultTheme / DarkTheme)
- [x] Suit le `Appearance.colorScheme` du système si mode = "system"

### 11. Tests ✅

**Fait le 2026-05-13** — **65 tests, 100% passent.**

- [x] Setup `ts-jest` (préset jest-expo abandonné, conflit avec RN 0.81)
- [x] Tests `srs.ts` : `calculateNextReview`, `getQualityFromAnswer`, `shouldReviewToday`, `calculateSuccessRate`, `getIntervalDescription`, `getMasteryLevel`
- [x] Tests `gamification.ts` : `calculateLevel`, `getLevelInfo`, `calculateExerciseXP`, `updateStreak`, `checkAchievements`, `updateDailyProgress`, `getTodayProgress`
- [x] Tests `exercises.ts` : `generateExercises`, `calculateScore`, `getFeedbackMessage`, fallback identify_nuance
- [x] Scripts `pnpm test` / `pnpm test:watch`

---

## ✨ Dernière touche

### 12. Animations ✅

**Fait le 2026-05-13.**

- [x] `ProgressBar` animée (interpolation `Animated.Value` + easing cubic)
- [x] Shake animation sur mauvaise réponse (`Animated.sequence` 5 oscillations)
- [x] Confettis sur exercice parfait, level up, ou objectif quotidien atteint (`react-native-confetti-cannon`)
- [x] Transitions Stack par défaut (RN Navigation v7 gère)

---

## 🔧 Dette technique

- [x] **Migration React Navigation v6 → v7** (2026-05-13) — code 100% compatible, aucune modification nécessaire
- [x] **`SettingsScreen`** (2026-05-13) — mode sombre, objectif quotidien, reset progression
- [x] **Reset streak en arrière-plan** (2026-05-13) — `isStreakBroken` appelé au mount de HomeScreen
- [x] **Logger centralisé** (2026-05-13) — `src/services/logger.ts` avec scopes et sinks remplaçables
- [ ] ~~Versioning des migrations DB~~ — la pattern `ensureColumn` reste suffisante pour le scope actuel
- [ ] **Splash screen + icône d'app** — config OK dans `app.json`, mais nécessite les fichiers PNG (à fournir par le designer)

---

## 📊 Suivi global

| Phase | Fonctionnalité | État |
|-------|---------------|------|
| 1 | Infrastructure | ✅ |
| 2 | Base de données (+ migrations idempotentes) | ✅ |
| 3 | SRS (SM-2) | ✅ |
| 4 | Navigation (RN v7) & écrans | ✅ |
| 5 | Apprentissage (flashcards) | ✅ |
| 6 | Composants réutilisables | ✅ |
| 7 | Exercices (5/5 types) | ✅ |
| 8 | Révision | ✅ |
| 9 | Gamification (logique + UI + animations) | ✅ |
| 10 | Contenu vocabulaire | ⚠️ 1124 mots / 15 thèmes (objectif 2000+) |
| 11 | Tests | ✅ 65 tests unitaires |
| 12 | Recherche FTS5 | ✅ |
| 13 | Mode sombre + Settings | ✅ |
| 14 | Audio TTS | ❌ skippé |
| 15 | Splash + icône | ⚠️ config faite, fichiers PNG manquants |

---

## 🚀 Ce qu'il reste vraiment

### Petites finitions
- [ ] **Splash + icône** : fournir les PNG (1024×1024 pour icône, 1242×2436 pour splash)
- [ ] **Audio / TTS (#7)** — feature volontairement remise à plus tard

### Contenu (non-code)
- [ ] **Vocabulaire 1124 → 2000+** : travail de curation linguistique
- [ ] **Paires de nuance supplémentaires** dans `Nuances lexicales`

### Nice-to-have
- [ ] Tests d'intégration (flux complet Exercise → DB → SRS)
- [ ] Snapshot tests sur les composants UI principaux
- [ ] Système de versioning des migrations DB si le schéma se complexifie
