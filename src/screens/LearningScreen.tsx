import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getWordsByTheme, initializeWordProgress } from '../services/database';
import { Word } from '../types';
import VocabCard from '../components/VocabCard';
import ProgressBar from '../components/ProgressBar';
import { useTheme } from '../theme/ThemeContext';
import { Colors } from '../theme/colors';

type LearningScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Learning'
>;
type LearningScreenRouteProp = RouteProp<RootStackParamList, 'Learning'>;

interface Props {
  navigation: LearningScreenNavigationProp;
  route: LearningScreenRouteProp;
}

type Phase = 'loading' | 'flashcards' | 'summary';

const LearningScreen: React.FC<Props> = ({ navigation, route }) => {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const { theme } = route.params;
  const [words, setWords] = useState<Word[]>([]);
  const [phase, setPhase] = useState<Phase>('loading');
  const [index, setIndex] = useState(0);
  const [knownIds, setKnownIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadWords();
  }, []);

  const loadWords = async () => {
    try {
      const themeWords = await getWordsByTheme(theme.id);
      setWords(themeWords);
      setPhase(themeWords.length > 0 ? 'flashcards' : 'summary');
    } catch (error) {
      console.error('Error loading words:', error);
      setPhase('summary');
    }
  };

  const advance = async (markAsKnown: boolean) => {
    const current = words[index];
    if (current) {
      await initializeWordProgress(current.id);
      if (markAsKnown) {
        setKnownIds((prev) => {
          const next = new Set(prev);
          next.add(current.id);
          return next;
        });
      }
    }

    if (index + 1 >= words.length) {
      setPhase('summary');
    } else {
      setIndex(index + 1);
    }
  };

  const startExercises = () => {
    const toPractice = words.filter((w) => !knownIds.has(w.id));
    const list = toPractice.length > 0 ? toPractice : words;
    navigation.navigate('Exercise', { words: list, themeId: theme.id });
  };

  if (phase === 'loading') {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (phase === 'summary') {
    const newCount = words.length - knownIds.size;
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>{theme.name}</Text>
          <Text style={styles.description}>Aperçu terminé 🎉</Text>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{newCount}</Text>
              <Text style={styles.statLabel}>nouveaux mots</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{knownIds.size}</Text>
              <Text style={styles.statLabel}>déjà connus</Text>
            </View>
          </View>

          <Text style={styles.note}>
            💡 Les exercices te permettront de mémoriser ces mots grâce à la
            répétition espacée.
          </Text>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={startExercises}
            disabled={words.length === 0}
          >
            <Text style={styles.primaryButtonText}>
              🚀 Commencer les exercices
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.secondaryButtonText}>Retour aux thèmes</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentWord = words[index];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.progressHeader}>
          <ProgressBar current={index + 1} total={words.length} />
        </View>

        <View style={styles.cardWrapper}>
          <VocabCard
            word={currentWord}
            onInfoPress={() =>
              navigation.navigate('WordDetail', { word: currentWord })
            }
          />
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.knownButton]}
            onPress={() => advance(true)}
          >
            <Text style={[styles.actionButtonText, styles.knownButtonText]}>
              Je connais déjà
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.nextButton]}
            onPress={() => advance(false)}
          >
            <Text style={[styles.actionButtonText, styles.nextButtonText]}>
              Suivant →
            </Text>
          </TouchableOpacity>
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
    center: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    content: {
      flex: 1,
      padding: 20,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      marginBottom: 8,
      color: c.text,
    },
    description: {
      fontSize: 16,
      color: c.textMuted,
      marginBottom: 24,
    },
    progressHeader: {
      marginBottom: 16,
    },
    cardWrapper: {
      flex: 1,
      marginBottom: 16,
    },
    actions: {
      flexDirection: 'row',
      gap: 12,
    },
    actionButton: {
      flex: 1,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
    },
    actionButtonText: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    knownButton: {
      backgroundColor: c.surface,
    },
    knownButtonText: {
      color: c.textSecondary,
    },
    nextButton: {
      backgroundColor: c.primary,
    },
    nextButtonText: {
      color: '#fff',
    },
    statsRow: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 24,
    },
    statBox: {
      flex: 1,
      backgroundColor: c.surface,
      padding: 20,
      borderRadius: 12,
      alignItems: 'center',
    },
    statValue: {
      fontSize: 32,
      fontWeight: 'bold',
      color: c.primary,
    },
    statLabel: {
      fontSize: 13,
      color: c.textMuted,
      marginTop: 4,
    },
    note: {
      fontSize: 13,
      color: c.textMuted,
      textAlign: 'center',
      fontStyle: 'italic',
      marginBottom: 24,
    },
    primaryButton: {
      backgroundColor: c.primary,
      padding: 18,
      borderRadius: 12,
      alignItems: 'center',
      marginBottom: 12,
    },
    primaryButtonText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#fff',
    },
    secondaryButton: {
      padding: 14,
      alignItems: 'center',
    },
    secondaryButtonText: {
      fontSize: 14,
      color: c.textMuted,
    },
  });

export default LearningScreen;
