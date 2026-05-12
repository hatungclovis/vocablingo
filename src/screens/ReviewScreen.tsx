import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getWordsForReview } from '../services/database';
import { Word } from '../types';

type ReviewScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Review'
>;

interface Props {
  navigation: ReviewScreenNavigationProp;
}

const ReviewScreen: React.FC<Props> = ({ navigation }) => {
  const [words, setWords] = useState<Word[]>([]);

  useEffect(() => {
    loadWords();
  }, []);

  const loadWords = async () => {
    try {
      const reviewWords = await getWordsForReview();
      setWords(reviewWords);
    } catch (error) {
      console.error('Error loading words:', error);
    }
  };

  const startReview = () => {
    if (words.length > 0) {
      navigation.navigate('Exercise', { words });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>🔄</Text>
        <Text style={styles.title}>Révision du jour</Text>

        {words.length > 0 ? (
          <>
            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>
                {words.length} mot{words.length > 1 ? 's' : ''} à réviser
              </Text>
              <Text style={styles.infoText}>
                Ces mots sont dus pour aujourd'hui selon votre calendrier de
                répétition espacée.
              </Text>
            </View>

            <TouchableOpacity style={styles.startButton} onPress={startReview}>
              <Text style={styles.startButtonText}>
                🚀 Commencer la révision
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>🎉 Rien à réviser!</Text>
              <Text style={styles.emptyText}>
                Vous êtes à jour avec vos révisions. Revenez demain ou apprenez
                de nouveaux mots.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.learnButton}
              onPress={() => navigation.navigate('Themes')}
            >
              <Text style={styles.learnButtonText}>
                📚 Apprendre de nouveaux mots
              </Text>
            </TouchableOpacity>
          </>
        )}

        <View style={styles.tipBox}>
          <Text style={styles.tipText}>
            💡 Astuce: Révisez chaque jour pour maintenir vos acquis et améliorer
            votre rétention à long terme!
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 80,
    textAlign: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 32,
  },
  infoBox: {
    backgroundColor: '#E3F2FD',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#1CB0F6',
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#0D47A1',
  },
  infoText: {
    fontSize: 14,
    color: '#1565C0',
  },
  emptyBox: {
    backgroundColor: '#E8F5E9',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#58CC02',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#2E7D32',
  },
  emptyText: {
    fontSize: 14,
    color: '#388E3C',
  },
  startButton: {
    backgroundColor: '#1CB0F6',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  learnButton: {
    backgroundColor: '#58CC02',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  learnButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  tipBox: {
    backgroundColor: '#FFF3CD',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9600',
  },
  tipText: {
    fontSize: 12,
    color: '#856404',
    textAlign: 'center',
  },
});

export default ReviewScreen;
