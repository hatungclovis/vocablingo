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
import { useTheme } from '../theme/ThemeContext';
import { Colors } from '../theme/colors';

type ReviewScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Review'
>;

interface Props {
  navigation: ReviewScreenNavigationProp;
}

const ReviewScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

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

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
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
      color: c.text,
    },
    infoBox: {
      backgroundColor: c.infoHighlight,
      padding: 20,
      borderRadius: 12,
      marginBottom: 24,
      borderLeftWidth: 4,
      borderLeftColor: c.info,
    },
    infoTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 8,
      color: c.info,
    },
    infoText: {
      fontSize: 14,
      color: c.info,
    },
    emptyBox: {
      backgroundColor: c.primaryHighlight,
      padding: 20,
      borderRadius: 12,
      marginBottom: 24,
      borderLeftWidth: 4,
      borderLeftColor: c.primary,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 8,
      color: c.success,
    },
    emptyText: {
      fontSize: 14,
      color: c.success,
    },
    startButton: {
      backgroundColor: c.info,
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
      backgroundColor: c.primary,
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
      backgroundColor: c.warningHighlight,
      padding: 16,
      borderRadius: 12,
      borderLeftWidth: 4,
      borderLeftColor: c.warning,
    },
    tipText: {
      fontSize: 12,
      color: c.warning,
      textAlign: 'center',
    },
  });

export default ReviewScreen;
