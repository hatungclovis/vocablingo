import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getUserProgress } from '../services/database';
import {
  calculateSuccessRate,
  getIntervalDescription,
  getMasteryLevel,
} from '../services/srs';
import { UserProgress } from '../types';
import { useTheme } from '../theme/ThemeContext';
import { Colors } from '../theme/colors';

type Nav = StackNavigationProp<RootStackParamList, 'WordDetail'>;
type Rt = RouteProp<RootStackParamList, 'WordDetail'>;

interface Props {
  navigation: Nav;
  route: Rt;
}

const WordDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const MASTERY_LABELS: Record<string, { label: string; color: string }> = {
    new: { label: 'Nouveau', color: colors.masteryNew },
    learning: { label: 'En apprentissage', color: colors.masteryLearning },
    review: { label: 'En révision', color: colors.masteryReview },
    mastered: { label: 'Maîtrisé', color: colors.masteryMastered },
  };

  const { word } = route.params;
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const p = await getUserProgress(word.id);
      setProgress(p);
    } catch (e) {
      console.error('Error loading progress:', e);
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

  const successRate = progress
    ? calculateSuccessRate(progress.times_seen, progress.times_correct)
    : 0;
  const masteryKey = progress
    ? getMasteryLevel(progress.repetitions, successRate)
    : 'new';
  const mastery = MASTERY_LABELS[masteryKey];

  const daysUntilReview = progress
    ? Math.max(
        0,
        Math.ceil(
          (new Date(progress.next_review_date).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24)
        )
      )
    : null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.word}>{word.word}</Text>
          <View style={styles.badges}>
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>{word.level}</Text>
            </View>
            <View style={[styles.masteryBadge, { backgroundColor: mastery.color }]}>
              <Text style={styles.masteryText}>{mastery.label}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.definition}>{word.definition}</Text>

        {word.examples.length > 0 && (
          <Section title="Exemples">
            {word.examples.map((ex, i) => (
              <Text key={i} style={styles.example}>
                « {ex} »
              </Text>
            ))}
          </Section>
        )}

        {word.synonyms.length > 0 && (
          <Section title="Synonymes">
            <Text style={styles.tagsLine}>{word.synonyms.join(' · ')}</Text>
          </Section>
        )}

        {word.antonyms.length > 0 && (
          <Section title="Antonymes">
            <Text style={styles.tagsLine}>{word.antonyms.join(' · ')}</Text>
          </Section>
        )}

        {word.nuance_with && word.nuance_with.length > 0 && (
          <Section title="Nuances à distinguer">
            <Text style={styles.tagsLine}>{word.nuance_with.join(' · ')}</Text>
          </Section>
        )}

        <View style={styles.statsBox}>
          <Text style={styles.statsTitle}>📊 Tes statistiques</Text>
          <Stat label="Vu" value={`${progress?.times_seen ?? 0} fois`} />
          <Stat label="Correct" value={`${progress?.times_correct ?? 0} fois`} />
          <Stat label="Taux de réussite" value={`${successRate}%`} />
          <Stat
            label="Prochaine révision"
            value={
              progress
                ? daysUntilReview === 0
                  ? "Aujourd'hui"
                  : getIntervalDescription(daysUntilReview ?? 0)
                : 'Pas encore vu'
            }
          />
          <Stat
            label="Facteur de facilité"
            value={progress ? progress.easiness_factor.toFixed(2) : '—'}
          />
        </View>

        <TouchableOpacity
          style={styles.practiceButton}
          onPress={() => navigation.replace('Exercise', { words: [word] })}
        >
          <Text style={styles.practiceButtonText}>🚀 Pratiquer ce mot maintenant</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
};

const Stat: React.FC<{ label: string; value: string }> = ({ label, value }) => {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
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
    scroll: {
      padding: 20,
      paddingBottom: 32,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    word: {
      fontSize: 32,
      fontWeight: 'bold',
      color: c.text,
      flexShrink: 1,
    },
    badges: {
      flexDirection: 'row',
      gap: 8,
      marginLeft: 12,
    },
    levelBadge: {
      backgroundColor: c.primary,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
    },
    levelText: {
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 12,
    },
    masteryBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
    },
    masteryText: {
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 12,
    },
    definition: {
      fontSize: 18,
      color: c.textSecondary,
      lineHeight: 26,
      marginBottom: 20,
    },
    section: {
      marginTop: 16,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: 'bold',
      color: c.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: 6,
    },
    example: {
      fontSize: 15,
      color: c.textSecondary,
      fontStyle: 'italic',
      lineHeight: 22,
      marginBottom: 4,
    },
    tagsLine: {
      fontSize: 15,
      color: c.textSecondary,
      lineHeight: 22,
    },
    statsBox: {
      marginTop: 24,
      backgroundColor: c.surface,
      padding: 16,
      borderRadius: 12,
    },
    statsTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 12,
      color: c.text,
    },
    statRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 6,
      borderBottomWidth: 1,
      borderBottomColor: c.divider,
    },
    statLabel: {
      fontSize: 14,
      color: c.textSecondary,
    },
    statValue: {
      fontSize: 14,
      fontWeight: 'bold',
      color: c.text,
    },
    practiceButton: {
      marginTop: 24,
      backgroundColor: c.primary,
      padding: 18,
      borderRadius: 12,
      alignItems: 'center',
    },
    practiceButtonText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#fff',
    },
  });

export default WordDetailScreen;
