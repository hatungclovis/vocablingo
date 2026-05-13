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
import { getWordsForReview, getAllWords, getAllProgress, getUserStats } from '../services/database';
import { getLevelInfo, getLevelEmoji } from '../services/gamification';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

interface Props {
  navigation: HomeScreenNavigationProp;
}

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const [wordsToReview, setWordsToReview] = useState(0);
  const [totalWords, setTotalWords] = useState(0);
  const [wordsLearned, setWordsLearned] = useState(0);
  const [userLevel, setUserLevel] = useState(1);
  const [userXP, setUserXP] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [levelProgress, setLevelProgress] = useState(0);

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

      // Charger les stats de gamification
      const stats = await getUserStats();
      if (stats) {
        const levelInfo = getLevelInfo(stats.total_xp);
        setUserLevel(levelInfo.level);
        setUserXP(stats.total_xp);
        setCurrentStreak(stats.current_streak);
        setLevelProgress(levelInfo.progressPercentage);
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
        </View>

        {/* Gamification - Niveau et XP */}
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
          <View style={styles.levelProgressBar}>
            <View
              style={[styles.levelProgressFill, { width: `${levelProgress}%` }]}
            />
          </View>
          <Text style={styles.levelProgressText}>
            {levelProgress}% vers le niveau {userLevel + 1}
          </Text>
        </View>

        {/* Statistiques */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{wordsLearned}</Text>
            <Text style={styles.statLabel}>Mots appris</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{totalWords}</Text>
            <Text style={styles.statLabel}>Mots totaux</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{wordsToReview}</Text>
            <Text style={styles.statLabel}>À réviser</Text>
          </View>
        </View>

        {/* Boutons d'action */}
        <View style={styles.actionsContainer}>
          {wordsToReview > 0 && (
            <TouchableOpacity
              style={[styles.actionButton, styles.reviewButton]}
              onPress={() => navigation.navigate('Review')}
            >
              <Text style={styles.actionButtonText}>🔄 Réviser ({wordsToReview})</Text>
              <Text style={styles.actionButtonSubtext}>
                Révisez les mots dus aujourd'hui
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionButton, styles.learnButton]}
            onPress={() => navigation.navigate('Themes')}
          >
            <Text style={styles.actionButtonText}>📚 Apprendre</Text>
            <Text style={styles.actionButtonSubtext}>
              Explorez les thèmes et apprenez de nouveaux mots
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.progressButton]}
            onPress={() => navigation.navigate('Progress')}
          >
            <Text style={styles.actionButtonText}>📊 Ma progression</Text>
            <Text style={styles.actionButtonSubtext}>
              Consultez vos statistiques détaillées
            </Text>
          </TouchableOpacity>
        </View>

        {/* Motivation du jour */}
        <View style={styles.motivationContainer}>
          <Text style={styles.motivationText}>
            💪 "Un mot par jour éloigne l'ignorance pour toujours!"
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
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  levelContainer: {
    backgroundColor: '#f8f8f8',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
  },
  xpText: {
    fontSize: 14,
    color: '#666',
  },
  streakBadge: {
    backgroundColor: '#FFE5E5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  streakText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  levelProgressBar: {
    height: 12,
    backgroundColor: '#e0e0e0',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  levelProgressFill: {
    height: '100%',
    backgroundColor: '#58CC02',
  },
  levelProgressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
    paddingVertical: 20,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#58CC02',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  actionsContainer: {
    marginBottom: 20,
  },
  actionButton: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  reviewButton: {
    backgroundColor: '#1CB0F6',
  },
  learnButton: {
    backgroundColor: '#58CC02',
  },
  progressButton: {
    backgroundColor: '#FF9600',
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
  motivationContainer: {
    padding: 16,
    backgroundColor: '#FFF3CD',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9600',
  },
  motivationText: {
    fontSize: 14,
    color: '#856404',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

export default HomeScreen;
