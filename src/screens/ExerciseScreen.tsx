import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Exercise } from '../types';
import {
  generateExercises,
  calculateScore,
  getFeedbackMessage,
} from '../services/exercises';
import {
  getAllWords,
  getAllProgress,
  getUserProgress,
  initializeWordProgress,
  updateUserProgress,
  addExerciseToHistory,
  getUserStats,
  updateUserStats,
} from '../services/database';
import {
  calculateNextReview,
  getQualityFromAnswer,
} from '../services/srs';
import {
  calculateExerciseXP,
  updateStreak,
  checkAchievements,
  calculateLevel,
  updateDailyProgress,
  Achievement,
} from '../services/gamification';
import ProgressBar from '../components/ProgressBar';
import { useTheme } from '../theme/ThemeContext';
import { Colors } from '../theme/colors';

type ExerciseScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Exercise'
>;
type ExerciseScreenRouteProp = RouteProp<RootStackParamList, 'Exercise'>;

interface Props {
  navigation: ExerciseScreenNavigationProp;
  route: ExerciseScreenRouteProp;
}

const ExerciseScreen: React.FC<Props> = ({ navigation, route }) => {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const { words } = route.params;
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [leveledUp, setLeveledUp] = useState(false);
  const [newLevel, setNewLevel] = useState(1);
  const [streakUpdated, setStreakUpdated] = useState(false);
  const [unlockedAchievements, setUnlockedAchievements] = useState<Achievement[]>([]);
  const [dailyGoalReached, setDailyGoalReached] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const confettiRef = useRef<ConfettiCannon | null>(null);
  const screenWidth = Dimensions.get('window').width;

  useEffect(() => {
    loadExercises();
  }, []);

  const loadExercises = async () => {
    try {
      const allWords = await getAllWords();
      const generatedExercises = generateExercises(words, allWords, 10);
      setExercises(generatedExercises);
    } catch (error) {
      console.error('Error loading exercises:', error);
    }
  };

  const currentExercise = exercises[currentIndex];

  const triggerShake = () => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleAnswerSelect = async (answerIndex: number) => {
    if (isAnswered) return;

    setSelectedAnswer(answerIndex);
    setIsAnswered(true);

    const isCorrect = answerIndex === currentExercise.correctAnswer;

    if (isCorrect) {
      setCorrectAnswers((prev) => prev + 1);
    } else {
      triggerShake();
    }

    // Sauvegarder dans l'historique
    await addExerciseToHistory(currentExercise.word.id, currentExercise.type, isCorrect);

    // Mettre à jour la progression SRS
    await updateSRSProgress(currentExercise.word.id, isCorrect);
  };

  const updateSRSProgress = async (wordId: number, isCorrect: boolean) => {
    try {
      let progress = await getUserProgress(wordId);

      // Si pas de progression, initialiser
      if (!progress) {
        await initializeWordProgress(wordId);
        progress = await getUserProgress(wordId);
      }

      if (!progress) return;

      // Calculer la prochaine révision avec l'algorithme SRS
      const quality = getQualityFromAnswer(isCorrect, 'medium');
      const newProgress = calculateNextReview(progress, quality, isCorrect);

      await updateUserProgress({
        word_id: wordId,
        ...newProgress,
      });
    } catch (error) {
      console.error('Error updating SRS progress:', error);
    }
  };

  const handleNext = () => {
    if (currentIndex < exercises.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    } else {
      // Fin des exercices - Calculer les récompenses
      processGamificationRewards();
      setShowResults(true);
    }
  };

  const processGamificationRewards = async () => {
    try {
      const stats = await getUserStats();
      if (!stats) return;

      // Calculer les XP gagnés
      let xp = calculateExerciseXP(correctAnswers, exercises.length);

      // Objectif quotidien
      const daily = updateDailyProgress(
        stats.daily_goal ?? 5,
        stats.daily_progress_count ?? 0,
        stats.daily_progress_date ?? null
      );
      xp += daily.xpBonus;
      setDailyGoalReached(daily.goalJustReached);
      setXpEarned(xp);

      // Mettre à jour les stats
      const newTotalXP = stats.total_xp + xp;
      const isPerfect = correctAnswers === exercises.length;
      const newPerfectCount = isPerfect
        ? stats.perfect_exercises_count + 1
        : stats.perfect_exercises_count;

      // Mettre à jour le streak
      const streakUpdate = updateStreak(stats.last_activity_date, stats.current_streak);
      const newStreak = streakUpdate.newStreak;
      const newLongestStreak = Math.max(newStreak, stats.longest_streak);

      // Calculer le nouveau niveau
      const level = calculateLevel(newTotalXP);
      const hasLeveledUp = level > stats.level;

      setLeveledUp(hasLeveledUp);
      setNewLevel(level);
      setStreakUpdated(newStreak > stats.current_streak);

      // Compter les mots appris (une seule requête)
      const [allWords, progressMap] = await Promise.all([
        getAllWords(),
        getAllProgress(),
      ]);
      let wordsLearned = 0;
      for (const word of allWords) {
        const progress = progressMap.get(word.id);
        if (progress && progress.times_seen > 0) {
          wordsLearned++;
        }
      }

      // Vérifier les achievements
      const updatedStats = {
        ...stats,
        total_xp: newTotalXP,
        level,
        current_streak: newStreak,
        longest_streak: newLongestStreak,
        total_exercises_completed: stats.total_exercises_completed + 1,
        total_correct_answers: stats.total_correct_answers + correctAnswers,
        perfect_exercises_count: newPerfectCount,
      };

      const newAchievements = checkAchievements(
        updatedStats,
        wordsLearned,
        newPerfectCount
      );

      setUnlockedAchievements(newAchievements);

      // Ajouter les nouveaux achievements débloqués
      const achievementIds = [
        ...stats.achievements,
        ...newAchievements.map((a) => a.id),
      ];

      // Sauvegarder les stats
      await updateUserStats({
        total_xp: newTotalXP,
        level,
        current_streak: newStreak,
        longest_streak: newLongestStreak,
        last_activity_date: new Date().toISOString(),
        total_exercises_completed: stats.total_exercises_completed + 1,
        total_correct_answers: stats.total_correct_answers + correctAnswers,
        perfect_exercises_count: newPerfectCount,
        achievements: achievementIds,
        daily_progress_count: daily.newCount,
        daily_progress_date: daily.newDate,
      });
    } catch (error) {
      console.error('Error processing gamification rewards:', error);
    }
  };

  const handleFinish = () => {
    navigation.navigate('Home');
  };

  if (exercises.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Génération des exercices...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (showResults) {
    const score = calculateScore(correctAnswers, exercises.length);
    const feedbackMessage = getFeedbackMessage(score);

    const shouldConfetti =
      correctAnswers === exercises.length || leveledUp || dailyGoalReached;
    return (
      <SafeAreaView style={styles.container}>
        {shouldConfetti && (
          <ConfettiCannon
            ref={(r) => {
              confettiRef.current = r;
            }}
            count={120}
            origin={{ x: screenWidth / 2, y: 0 }}
            fadeOut
            autoStart
            explosionSpeed={350}
            fallSpeed={2500}
          />
        )}
        <ScrollView contentContainerStyle={styles.resultsContainer}>
          <Text style={styles.resultsEmoji}>
            {score >= 75 ? '🎉' : score >= 50 ? '👍' : '📚'}
          </Text>
          <Text style={styles.resultsTitle}>Exercices terminés!</Text>

          <View style={styles.scoreBox}>
            <Text style={styles.scoreText}>{score}%</Text>
            <Text style={styles.scoreSubtext}>
              {correctAnswers} / {exercises.length} correct
              {correctAnswers > 1 ? 's' : ''}
            </Text>
          </View>

          <View style={styles.feedbackBox}>
            <Text style={styles.feedbackText}>{feedbackMessage}</Text>
          </View>

          {/* XP et Level Up */}
          {xpEarned > 0 && (
            <View style={styles.xpBox}>
              <Text style={styles.xpTitle}>+ {xpEarned} XP</Text>
              {leveledUp && (
                <Text style={styles.levelUpText}>
                  🎉 Niveau {newLevel} atteint!
                </Text>
              )}
              {streakUpdated && (
                <Text style={styles.streakText}>🔥 Streak maintenu!</Text>
              )}
              {dailyGoalReached && (
                <Text style={styles.dailyGoalText}>
                  🎯 Objectif quotidien atteint !
                </Text>
              )}
            </View>
          )}

          {unlockedAchievements.length > 0 && (
            <View style={styles.achievementsBox}>
              <Text style={styles.achievementsTitle}>
                🏆 {unlockedAchievements.length === 1
                  ? 'Trophée débloqué !'
                  : `${unlockedAchievements.length} trophées débloqués !`}
              </Text>
              {unlockedAchievements.map((a) => (
                <View key={a.id} style={styles.achievementRow}>
                  <Text style={styles.achievementIcon}>{a.icon}</Text>
                  <View style={styles.achievementBody}>
                    <Text style={styles.achievementName}>{a.title}</Text>
                    <Text style={styles.achievementDesc}>{a.description}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          <View style={styles.statsBox}>
            <Text style={styles.statsTitle}>Résumé :</Text>
            <Text style={styles.statsText}>
              ✅ Réponses correctes : {correctAnswers}
            </Text>
            <Text style={styles.statsText}>
              ❌ Réponses incorrectes : {exercises.length - correctAnswers}
            </Text>
            <Text style={styles.statsText}>
              📝 Exercices : {exercises.length}
            </Text>
          </View>

          <TouchableOpacity style={styles.finishButton} onPress={handleFinish}>
            <Text style={styles.finishButtonText}>🏠 Retour à l'accueil</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.progressContainer}>
          <ProgressBar
            current={currentIndex + 1}
            total={exercises.length}
            showLabel={false}
          />
          <Text style={styles.progressText}>
            Question {currentIndex + 1} / {exercises.length}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
          <Text style={styles.questionText}>{currentExercise.question}</Text>
        </Animated.View>

        <View style={styles.optionsContainer}>
          {currentExercise.options?.map((option, index) => {
            const isCorrect = index === currentExercise.correctAnswer;
            const isSelected = index === selectedAnswer;

            const buttonStyle = [
              styles.optionButton,
              isAnswered && isSelected && isCorrect ? styles.optionButtonCorrect : null,
              isAnswered && isSelected && !isCorrect ? styles.optionButtonWrong : null,
              isAnswered && !isSelected && isCorrect ? styles.optionButtonCorrect : null,
            ];

            return (
              <TouchableOpacity
                key={index}
                style={buttonStyle}
                onPress={() => handleAnswerSelect(index)}
                disabled={isAnswered}
              >
                <Text
                  style={[
                    styles.optionText,
                    isAnswered && (isCorrect || isSelected)
                      ? styles.optionTextAnswered
                      : {},
                  ]}
                >
                  {option}
                </Text>
                {isAnswered && isCorrect && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
                {isAnswered && isSelected && !isCorrect && (
                  <Text style={styles.crossmark}>✗</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {isAnswered && (
          <View style={styles.explanationContainer}>
            <Text style={styles.explanationTitle}>
              {selectedAnswer === currentExercise.correctAnswer
                ? '✅ Correct!'
                : '❌ Incorrect'}
            </Text>
            <Text style={styles.explanationText}>
              {currentExercise.explanation}
            </Text>

            {currentExercise.word.examples.length > 0 && (
              <View style={styles.exampleBox}>
                <Text style={styles.exampleTitle}>Exemple :</Text>
                <Text style={styles.exampleText}>
                  "{currentExercise.word.examples[0]}"
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {isAnswered && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>
              {currentIndex < exercises.length - 1 ? 'Suivant →' : 'Terminer'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
    },
    header: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    progressContainer: {
      marginBottom: 8,
      gap: 8,
    },
    progressText: {
      fontSize: 14,
      color: c.textMuted,
      textAlign: 'center',
    },
    content: {
      flex: 1,
      padding: 20,
    },
    questionText: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 24,
      lineHeight: 28,
      color: c.text,
    },
    optionsContainer: {
      marginBottom: 24,
    },
    optionButton: {
      backgroundColor: c.surface,
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
      borderWidth: 2,
      borderColor: c.border,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    optionButtonCorrect: {
      backgroundColor: c.primaryHighlight,
      borderColor: c.primary,
    },
    optionButtonWrong: {
      backgroundColor: c.dangerHighlight,
      borderColor: c.danger,
    },
    optionText: {
      fontSize: 16,
      color: c.textSecondary,
      flex: 1,
    },
    optionTextAnswered: {
      fontWeight: 'bold',
    },
    checkmark: {
      fontSize: 24,
      color: c.primary,
    },
    crossmark: {
      fontSize: 24,
      color: c.danger,
    },
    explanationContainer: {
      backgroundColor: c.surface,
      padding: 16,
      borderRadius: 12,
      marginTop: 16,
    },
    explanationTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 8,
      color: c.text,
    },
    explanationText: {
      fontSize: 14,
      color: c.textMuted,
      lineHeight: 20,
    },
    exampleBox: {
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
    exampleTitle: {
      fontSize: 12,
      fontWeight: 'bold',
      color: c.textMuted,
      marginBottom: 4,
    },
    exampleText: {
      fontSize: 14,
      fontStyle: 'italic',
      color: c.textSecondary,
    },
    footer: {
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
    nextButton: {
      backgroundColor: c.primary,
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
    },
    nextButtonText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#fff',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      fontSize: 16,
      color: c.textMuted,
    },
    resultsContainer: {
      padding: 20,
      alignItems: 'center',
    },
    resultsEmoji: {
      fontSize: 80,
      marginBottom: 20,
    },
    resultsTitle: {
      fontSize: 28,
      fontWeight: 'bold',
      marginBottom: 24,
      color: c.text,
    },
    scoreBox: {
      backgroundColor: c.primary,
      padding: 24,
      borderRadius: 12,
      alignItems: 'center',
      marginBottom: 24,
      width: '100%',
    },
    scoreText: {
      fontSize: 64,
      fontWeight: 'bold',
      color: '#fff',
    },
    scoreSubtext: {
      fontSize: 18,
      color: '#fff',
      marginTop: 8,
    },
    feedbackBox: {
      backgroundColor: c.primaryHighlight,
      padding: 16,
      borderRadius: 12,
      marginBottom: 24,
      width: '100%',
    },
    feedbackText: {
      fontSize: 16,
      color: c.success,
      textAlign: 'center',
    },
    xpBox: {
      backgroundColor: c.warningHighlight,
      padding: 20,
      borderRadius: 12,
      marginBottom: 24,
      width: '100%',
      alignItems: 'center',
      borderLeftWidth: 4,
      borderLeftColor: c.warning,
    },
    xpTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: c.warning,
      marginBottom: 8,
    },
    levelUpText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: c.primary,
      marginTop: 8,
    },
    streakText: {
      fontSize: 16,
      color: c.danger,
      marginTop: 4,
    },
    dailyGoalText: {
      fontSize: 16,
      color: c.info,
      fontWeight: 'bold',
      marginTop: 4,
    },
    achievementsBox: {
      backgroundColor: c.warningHighlight,
      padding: 16,
      borderRadius: 12,
      marginBottom: 24,
      width: '100%',
      borderLeftWidth: 4,
      borderLeftColor: c.warning,
    },
    achievementsTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: c.warning,
      marginBottom: 12,
      textAlign: 'center',
    },
    achievementRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 6,
    },
    achievementIcon: {
      fontSize: 28,
      marginRight: 12,
    },
    achievementBody: {
      flex: 1,
    },
    achievementName: {
      fontSize: 15,
      fontWeight: 'bold',
      color: c.text,
    },
    achievementDesc: {
      fontSize: 12,
      color: c.textMuted,
      marginTop: 2,
    },
    statsBox: {
      backgroundColor: c.surface,
      padding: 16,
      borderRadius: 12,
      marginBottom: 24,
      width: '100%',
    },
    statsTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 12,
      color: c.text,
    },
    statsText: {
      fontSize: 14,
      color: c.textMuted,
      marginBottom: 8,
    },
    finishButton: {
      backgroundColor: c.info,
      padding: 18,
      borderRadius: 12,
      alignItems: 'center',
      width: '100%',
    },
    finishButtonText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#fff',
    },
  });

export default ExerciseScreen;
