import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { getAllWords, getAllProgress } from '../services/database';
import { calculateSuccessRate, getMasteryLevel } from '../services/srs';

const ProgressScreen: React.FC = () => {
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
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.totalWords}</Text>
              <Text style={styles.statLabel}>Mots totaux</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.wordsLearned}</Text>
              <Text style={styles.statLabel}>Mots appris</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.totalExercises}</Text>
              <Text style={styles.statLabel}>Exercices</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.averageSuccessRate}%</Text>
              <Text style={styles.statLabel}>Taux de réussite</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 Niveau de maîtrise</Text>
          <View style={styles.masteryContainer}>
            <View style={styles.masteryRow}>
              <View style={[styles.masteryDot, { backgroundColor: '#e0e0e0' }]} />
              <Text style={styles.masteryLabel}>Nouveaux</Text>
              <Text style={styles.masteryValue}>{stats.wordsNew}</Text>
            </View>
            <View style={styles.masteryRow}>
              <View style={[styles.masteryDot, { backgroundColor: '#FFB800' }]} />
              <Text style={styles.masteryLabel}>En apprentissage</Text>
              <Text style={styles.masteryValue}>{stats.wordsLearning}</Text>
            </View>
            <View style={styles.masteryRow}>
              <View style={[styles.masteryDot, { backgroundColor: '#1CB0F6' }]} />
              <Text style={styles.masteryLabel}>En révision</Text>
              <Text style={styles.masteryValue}>{stats.wordsReview}</Text>
            </View>
            <View style={styles.masteryRow}>
              <View style={[styles.masteryDot, { backgroundColor: '#58CC02' }]} />
              <Text style={styles.masteryLabel}>Maîtrisés</Text>
              <Text style={styles.masteryValue}>{stats.wordsMastered}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💪 Progression globale</Text>
          <View style={styles.progressContainer}>
            <View style={styles.progressBarOuter}>
              <View
                style={[
                  styles.progressBarInner,
                  {
                    width: `${
                      stats.totalWords > 0
                        ? (stats.wordsLearned / stats.totalWords) * 100
                        : 0
                    }%`,
                  },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {stats.wordsLearned} / {stats.totalWords} mots commencés (
              {stats.totalWords > 0
                ? Math.round((stats.wordsLearned / stats.totalWords) * 100)
                : 0}
              %)
            </Text>
          </View>
        </View>

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: '#f8f8f8',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#58CC02',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  masteryContainer: {
    backgroundColor: '#f8f8f8',
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
  },
  masteryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  progressContainer: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
  },
  progressBarOuter: {
    height: 20,
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarInner: {
    height: '100%',
    backgroundColor: '#58CC02',
    borderRadius: 10,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  encouragementBox: {
    backgroundColor: '#E8F5E9',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#58CC02',
  },
  encouragementText: {
    fontSize: 16,
    color: '#2E7D32',
    textAlign: 'center',
  },
});

export default ProgressScreen;
