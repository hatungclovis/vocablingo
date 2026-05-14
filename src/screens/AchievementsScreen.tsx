import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import {
  getUserStats,
  getAllWords,
  getAllProgress,
} from '../services/database';
import { ACHIEVEMENTS, Achievement } from '../services/gamification';
import ProgressBar from '../components/ProgressBar';
import { useTheme } from '../theme/ThemeContext';
import { Colors } from '../theme/colors';

interface AchievementWithProgress extends Achievement {
  current: number; // valeur courante vers le critère
}

const AchievementsScreen: React.FC = () => {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const [achievements, setAchievements] = useState<AchievementWithProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const [stats, allWords, progressMap] = await Promise.all([
        getUserStats(),
        getAllWords(),
        getAllProgress(),
      ]);

      const unlockedIds: string[] = stats?.achievements ?? [];

      let wordsLearned = 0;
      for (const word of allWords) {
        const p = progressMap.get(word.id);
        if (p && p.times_seen > 0) wordsLearned++;
      }

      const enriched: AchievementWithProgress[] = ACHIEVEMENTS.map((a) => {
        const isUnlocked = unlockedIds.includes(a.id);
        let current = 0;
        switch (a.id) {
          case 'first_steps':
            current = stats?.total_exercises_completed ?? 0;
            break;
          case 'word_collector':
          case 'vocabulary_master':
            current = wordsLearned;
            break;
          case 'streak_3':
          case 'streak_7':
          case 'streak_30':
            current = stats?.current_streak ?? 0;
            break;
          case 'perfectionist':
            current = stats?.perfect_exercises_count ?? 0;
            break;
          case 'level_5':
          case 'level_10':
            current = stats?.level ?? 1;
            break;
        }
        return { ...a, unlocked: isUnlocked, current };
      });

      setAchievements(enriched);
    } catch (error) {
      console.error('Error loading achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  const unlocked = achievements.filter((a) => a.unlocked);
  const locked = achievements.filter((a) => !a.unlocked);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>
            🏆 {unlocked.length} / {achievements.length} débloqués
          </Text>
          <ProgressBar
            current={unlocked.length}
            total={achievements.length}
            showLabel={false}
            height={12}
          />
        </View>

        {unlocked.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Débloqués</Text>
            {unlocked.map((a) => (
              <AchievementRow key={a.id} achievement={a} />
            ))}
          </View>
        )}

        {locked.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>À débloquer</Text>
            {locked.map((a) => (
              <AchievementRow key={a.id} achievement={a} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const AchievementRow: React.FC<{ achievement: AchievementWithProgress }> = ({
  achievement,
}) => {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const { unlocked, current, requirement } = achievement;
  const capped = Math.min(current, requirement);

  return (
    <View style={[styles.row, unlocked ? styles.rowUnlocked : styles.rowLocked]}>
      <Text style={[styles.icon, !unlocked && styles.iconLocked]}>
        {achievement.icon}
      </Text>
      <View style={styles.rowBody}>
        <Text style={[styles.title, !unlocked && styles.titleLocked]}>
          {achievement.title}
        </Text>
        <Text style={[styles.description, !unlocked && styles.descriptionLocked]}>
          {achievement.description}
        </Text>
        {!unlocked && (
          <View style={styles.progressWrap}>
            <ProgressBar
              current={capped}
              total={requirement}
              showLabel={false}
              height={6}
              color={colors.textMuted}
            />
            <Text style={styles.progressText}>
              {capped} / {requirement}
            </Text>
          </View>
        )}
      </View>
      {unlocked && <Text style={styles.check}>✓</Text>}
    </View>
  );
};

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
    },
    center: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    scrollContent: {
      padding: 20,
    },
    summary: {
      backgroundColor: c.surface,
      padding: 16,
      borderRadius: 12,
      marginBottom: 24,
      gap: 12,
    },
    summaryTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      textAlign: 'center',
      color: c.text,
    },
    section: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: 'bold',
      color: c.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: 12,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 14,
      borderRadius: 12,
      marginBottom: 10,
      borderWidth: 1,
    },
    rowUnlocked: {
      backgroundColor: c.primaryHighlight,
      borderColor: c.primary,
    },
    rowLocked: {
      backgroundColor: c.surfaceAlt,
      borderColor: c.border,
    },
    icon: {
      fontSize: 36,
      marginRight: 14,
    },
    iconLocked: {
      opacity: 0.4,
    },
    rowBody: {
      flex: 1,
    },
    title: {
      fontSize: 16,
      fontWeight: 'bold',
      color: c.text,
    },
    titleLocked: {
      color: c.textSecondary,
    },
    description: {
      fontSize: 13,
      color: c.textSecondary,
      marginTop: 2,
    },
    descriptionLocked: {
      color: c.textMuted,
    },
    progressWrap: {
      marginTop: 8,
      gap: 4,
    },
    progressText: {
      fontSize: 11,
      color: c.textMuted,
      fontVariant: ['tabular-nums'],
    },
    check: {
      fontSize: 24,
      color: c.primary,
      fontWeight: 'bold',
      marginLeft: 8,
    },
  });

export default AchievementsScreen;
