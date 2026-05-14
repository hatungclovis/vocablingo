import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getAllWords, getAllProgress } from '../services/database';
import { calculateSuccessRate, getMasteryLevel } from '../services/srs';
import StatCard from '../components/StatCard';
import ProgressBar from '../components/ProgressBar';
import { useTheme } from '../theme/ThemeContext';
import { Colors } from '../theme/colors';

type ProgressScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Progress'
>;

interface Props {
  navigation: ProgressScreenNavigationProp;
}

const ProgressScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const [stats, setStats] = useState({
    totalWords: 0,
    wordsLearned: 0,
    wordsNew: 0,
    wordsLearning: 0,
    wordsReview: 0,
    wordsMastered: 0,
    averageSuccessRate: 0,
    totalExercises: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [allWords, progressMap] = await Promise.all([
        getAllWords(),
        getAllProgress(),
      ]);

      let learned = 0;
      let newWords = 0;
      let learning = 0;
      let review = 0;
      let mastered = 0;
      let totalCorrect = 0;
      let totalSeen = 0;

      for (const word of allWords) {
        const progress = progressMap.get(word.id);

        if (!progress || progress.times_seen === 0) {
          newWords++;
        } else {
          learned++;
          totalCorrect += progress.times_correct;
          totalSeen += progress.times_seen;

          const successRate = calculateSuccessRate(
            progress.times_seen,
            progress.times_correct
          );
          const masteryLevel = getMasteryLevel(progress.repetitions, successRate);

          switch (masteryLevel) {
            case 'learning':
              learning++;
              break;
            case 'review':
              review++;
              break;
            case 'mastered':
              mastered++;
              break;
          }
        }
      }

      const avgSuccessRate = totalSeen > 0 ? Math.round((totalCorrect / totalSeen) * 100) : 0;

      setStats({
        totalWords: allWords.length,
        wordsLearned: learned,
        wordsNew: newWords,
        wordsLearning: learning,
        wordsReview: review,
        wordsMastered: mastered,
        averageSuccessRate: avgSuccessRate,
        totalExercises: totalSeen,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Vue d'ensemble</Text>
          <View style={styles.statsGrid}>
            <StatCard value={stats.totalWords} label="Mots totaux" style={styles.gridItem} />
            <StatCard value={stats.wordsLearned} label="Mots appris" style={styles.gridItem} />
            <StatCard value={stats.totalExercises} label="Exercices" style={styles.gridItem} />
            <StatCard value={`${stats.averageSuccessRate}%`} label="Taux de réussite" style={styles.gridItem} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 Niveau de maîtrise</Text>
          <View style={styles.masteryContainer}>
            <View style={styles.masteryRow}>
              <View style={[styles.masteryDot, { backgroundColor: colors.masteryNew }]} />
              <Text style={styles.masteryLabel}>Nouveaux</Text>
              <Text style={styles.masteryValue}>{stats.wordsNew}</Text>
            </View>
            <View style={styles.masteryRow}>
              <View style={[styles.masteryDot, { backgroundColor: colors.masteryLearning }]} />
              <Text style={styles.masteryLabel}>En apprentissage</Text>
              <Text style={styles.masteryValue}>{stats.wordsLearning}</Text>
            </View>
            <View style={styles.masteryRow}>
              <View style={[styles.masteryDot, { backgroundColor: colors.masteryReview }]} />
              <Text style={styles.masteryLabel}>En révision</Text>
              <Text style={styles.masteryValue}>{stats.wordsReview}</Text>
            </View>
            <View style={styles.masteryRow}>
              <View style={[styles.masteryDot, { backgroundColor: colors.masteryMastered }]} />
              <Text style={styles.masteryLabel}>Maîtrisés</Text>
              <Text style={styles.masteryValue}>{stats.wordsMastered}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💪 Progression globale</Text>
          <View style={styles.progressContainer}>
            <ProgressBar
              current={stats.wordsLearned}
              total={stats.totalWords}
              showLabel={false}
              height={20}
            />
            <Text style={styles.progressText}>
              {stats.wordsLearned} / {stats.totalWords} mots commencés (
              {stats.totalWords > 0
                ? Math.round((stats.wordsLearned / stats.totalWords) * 100)
                : 0}
              %)
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.achievementsButton}
          onPress={() => navigation.navigate('Achievements')}
        >
          <Text style={styles.achievementsButtonText}>🏆 Voir mes trophées</Text>
        </TouchableOpacity>

        <View style={styles.encouragementBox}>
          <Text style={styles.encouragementText}>
            {stats.wordsMastered > 0
              ? `🎉 Félicitations! Vous avez maîtrisé ${stats.wordsMastered} mot${
                  stats.wordsMastered > 1 ? 's' : ''
                }!`
              : '💪 Continuez à apprendre pour maîtriser de nouveaux mots!'}
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
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 16,
      color: c.text,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    gridItem: {
      width: '48%',
      marginBottom: 12,
    },
    masteryContainer: {
      backgroundColor: c.surface,
      borderRadius: 12,
      padding: 16,
    },
    masteryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    masteryDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginRight: 12,
    },
    masteryLabel: {
      flex: 1,
      fontSize: 16,
      color: c.text,
    },
    masteryValue: {
      fontSize: 16,
      fontWeight: 'bold',
      color: c.textSecondary,
    },
    progressContainer: {
      backgroundColor: c.surface,
      borderRadius: 12,
      padding: 16,
      gap: 12,
    },
    progressText: {
      fontSize: 14,
      color: c.textMuted,
      textAlign: 'center',
    },
    achievementsButton: {
      backgroundColor: c.warning,
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginBottom: 24,
    },
    achievementsButtonText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#fff',
    },
    encouragementBox: {
      backgroundColor: c.primaryHighlight,
      padding: 16,
      borderRadius: 12,
      borderLeftWidth: 4,
      borderLeftColor: c.primary,
    },
    encouragementText: {
      fontSize: 16,
      color: c.success,
      textAlign: 'center',
    },
  });

export default ProgressScreen;
