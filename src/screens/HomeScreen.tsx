import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getWordsForReview, getAllWords, getAllProgress, getUserStats, updateUserStats } from '../services/database';
import { getLevelInfo, getLevelEmoji, getTodayProgress, isStreakBroken } from '../services/gamification';
import StatCard from '../components/StatCard';
import ProgressBar from '../components/ProgressBar';
import { useTheme } from '../theme/ThemeContext';
import { Colors } from '../theme/colors';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

interface Props {
  navigation: HomeScreenNavigationProp;
}

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const [wordsToReview, setWordsToReview] = useState(0);
  const [totalWords, setTotalWords] = useState(0);
  const [wordsLearned, setWordsLearned] = useState(0);
  const [userLevel, setUserLevel] = useState(1);
  const [userXP, setUserXP] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [levelProgress, setLevelProgress] = useState(0);
  const [dailyGoal, setDailyGoal] = useState(5);
  const [dailyProgress, setDailyProgress] = useState(0);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [reviewWords, allWords, progressMap] = await Promise.all([
        getWordsForReview(),
        getAllWords(),
        getAllProgress(),
      ]);

      setWordsToReview(reviewWords.length);
      setTotalWords(allWords.length);

      let learnedCount = 0;
      for (const word of allWords) {
        const progress = progressMap.get(word.id);
        if (progress && progress.times_seen > 0) {
          learnedCount++;
        }
      }
      setWordsLearned(learnedCount);

      const stats = await getUserStats();
      if (stats) {
        // Si le streak est cassé (>1 jour sans activité), le réinitialiser
        let effectiveStreak = stats.current_streak;
        if (isStreakBroken(stats.last_activity_date ?? null, stats.current_streak)) {
          effectiveStreak = 0;
          await updateUserStats({ current_streak: 0 });
        }

        const levelInfo = getLevelInfo(stats.total_xp);
        setUserLevel(levelInfo.level);
        setUserXP(stats.total_xp);
        setCurrentStreak(effectiveStreak);
        setLevelProgress(levelInfo.progressPercentage);
        setDailyGoal(stats.daily_goal ?? 5);
        setDailyProgress(
          getTodayProgress(
            stats.daily_progress_count ?? 0,
            stats.daily_progress_date ?? null
          )
        );
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>🇫🇷 Vocablingo</Text>
          <Text style={styles.subtitle}>
            Enrichissez votre vocabulaire français
          </Text>
          <TouchableOpacity
            style={styles.searchPill}
            onPress={() => navigation.navigate('Search')}
          >
            <Text style={styles.searchPillText}>🔍 Rechercher un mot…</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.levelContainer}>
          <View style={styles.levelHeader}>
            <Text style={styles.levelEmoji}>{getLevelEmoji(userLevel)}</Text>
            <View style={styles.levelInfo}>
              <Text style={styles.levelText}>Niveau {userLevel}</Text>
              <Text style={styles.xpText}>{userXP} XP</Text>
            </View>
            {currentStreak > 0 && (
              <View style={styles.streakBadge}>
                <Text style={styles.streakText}>🔥 {currentStreak}</Text>
              </View>
            )}
          </View>
          <ProgressBar
            current={levelProgress}
            total={100}
            showLabel={false}
            height={12}
          />
          <Text style={styles.levelProgressText}>
            {levelProgress}% vers le niveau {userLevel + 1}
          </Text>
        </View>

        <View style={styles.dailyContainer}>
          <View style={styles.dailyHeader}>
            <Text style={styles.dailyTitle}>🎯 Objectif quotidien</Text>
            <Text style={styles.dailyValue}>
              {Math.min(dailyProgress, dailyGoal)} / {dailyGoal}
            </Text>
          </View>
          <ProgressBar
            current={dailyProgress}
            total={dailyGoal}
            showLabel={false}
            height={10}
            color={dailyProgress >= dailyGoal ? colors.primary : colors.info}
          />
          {dailyProgress >= dailyGoal && (
            <Text style={styles.dailyDone}>✅ Objectif atteint aujourd'hui !</Text>
          )}
        </View>

        <View style={styles.statsContainer}>
          <StatCard variant="plain" value={wordsLearned} label="Mots appris" />
          <StatCard variant="plain" value={totalWords} label="Mots totaux" />
          <StatCard variant="plain" value={wordsToReview} label="À réviser" />
        </View>

        <View style={styles.actionsContainer}>
          {wordsToReview > 0 && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.info }]}
              onPress={() => navigation.navigate('Review')}
            >
              <Text style={styles.actionButtonText}>🔄 Réviser ({wordsToReview})</Text>
              <Text style={styles.actionButtonSubtext}>
                Révisez les mots dus aujourd'hui
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('Themes')}
          >
            <Text style={styles.actionButtonText}>📚 Apprendre</Text>
            <Text style={styles.actionButtonSubtext}>
              Explorez les thèmes et apprenez de nouveaux mots
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.warning }]}
            onPress={() => navigation.navigate('Progress')}
          >
            <Text style={styles.actionButtonText}>📊 Ma progression</Text>
            <Text style={styles.actionButtonSubtext}>
              Consultez vos statistiques détaillées
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingsLink}
            onPress={() => navigation.navigate('Settings')}
          >
            <Text style={styles.settingsLinkText}>⚙️  Paramètres</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.motivationContainer}>
          <Text style={styles.motivationText}>
            💪 "Un mot par jour éloigne l'ignorance pour toujours!"
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
    },
    scrollContent: {
      padding: 20,
    },
    header: {
      alignItems: 'center',
      marginBottom: 30,
    },
    title: {
      fontSize: 36,
      fontWeight: 'bold',
      marginBottom: 8,
      color: c.text,
    },
    subtitle: {
      fontSize: 16,
      color: c.textSecondary,
      textAlign: 'center',
    },
    searchPill: {
      marginTop: 16,
      backgroundColor: c.surface,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 999,
    },
    searchPillText: {
      fontSize: 14,
      color: c.textSecondary,
    },
    levelContainer: {
      backgroundColor: c.surface,
      padding: 16,
      borderRadius: 12,
      marginBottom: 20,
      gap: 8,
    },
    levelHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    levelEmoji: {
      fontSize: 40,
      marginRight: 12,
    },
    levelInfo: {
      flex: 1,
    },
    levelText: {
      fontSize: 20,
      fontWeight: 'bold',
      color: c.text,
    },
    xpText: {
      fontSize: 14,
      color: c.textSecondary,
    },
    streakBadge: {
      backgroundColor: c.dangerHighlight,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
    },
    streakText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: c.text,
    },
    levelProgressText: {
      fontSize: 12,
      color: c.textSecondary,
      textAlign: 'center',
    },
    dailyContainer: {
      backgroundColor: c.infoHighlight,
      padding: 16,
      borderRadius: 12,
      marginBottom: 20,
      gap: 10,
      borderLeftWidth: 4,
      borderLeftColor: c.info,
    },
    dailyHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    dailyTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: c.text,
    },
    dailyValue: {
      fontSize: 16,
      fontWeight: 'bold',
      color: c.info,
      fontVariant: ['tabular-nums'],
    },
    dailyDone: {
      fontSize: 13,
      color: c.success,
      fontWeight: 'bold',
      textAlign: 'center',
      marginTop: 2,
    },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: 30,
      paddingVertical: 20,
      backgroundColor: c.surface,
      borderRadius: 12,
    },
    actionsContainer: {
      marginBottom: 20,
    },
    actionButton: {
      padding: 20,
      borderRadius: 12,
      marginBottom: 16,
    },
    actionButtonText: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#fff',
      marginBottom: 4,
    },
    actionButtonSubtext: {
      fontSize: 14,
      color: '#fff',
      opacity: 0.9,
    },
    settingsLink: {
      padding: 14,
      alignItems: 'center',
    },
    settingsLinkText: {
      fontSize: 14,
      color: c.textSecondary,
    },
    motivationContainer: {
      padding: 16,
      backgroundColor: c.warningHighlight,
      borderRadius: 12,
      borderLeftWidth: 4,
      borderLeftColor: c.warning,
    },
    motivationText: {
      fontSize: 14,
      color: c.text,
      fontStyle: 'italic',
      textAlign: 'center',
    },
  });

export default HomeScreen;
