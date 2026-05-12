import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getWordsByTheme } from '../services/database';
import { Word } from '../types';

type LearningScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Learning'
>;
type LearningScreenRouteProp = RouteProp<RootStackParamList, 'Learning'>;

interface Props {
  navigation: LearningScreenNavigationProp;
  route: LearningScreenRouteProp;
}

const LearningScreen: React.FC<Props> = ({ navigation, route }) => {
  const { theme } = route.params;
  const [words, setWords] = useState<Word[]>([]);

  useEffect(() => {
    loadWords();
  }, []);

  const loadWords = async () => {
    try {
      const themeWords = await getWordsByTheme(theme.id);
      setWords(themeWords);
    } catch (error) {
      console.error('Error loading words:', error);
    }
  };

  const startExercises = () => {
    if (words.length > 0) {
      navigation.navigate('Exercise', { words, themeId: theme.id });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{theme.name}</Text>
        <Text style={styles.description}>{theme.description}</Text>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>📚 {words.length} mots disponibles</Text>
          <Text style={styles.infoText}>🎯 Niveau: B2-C2</Text>
        </View>

        <View style={styles.wordsList}>
          <Text style={styles.wordsListTitle}>Aperçu des mots :</Text>
          {words.slice(0, 5).map((word) => (
            <View key={word.id} style={styles.wordPreview}>
              <Text style={styles.wordText}>• {word.word}</Text>
              <Text style={styles.wordDefinition}>{word.definition}</Text>
            </View>
          ))}
          {words.length > 5 && (
            <Text style={styles.moreWords}>
              ... et {words.length - 5} autres mots
            </Text>
          )}
        </View>

        <TouchableOpacity style={styles.startButton} onPress={startExercises}>
          <Text style={styles.startButtonText}>🚀 Commencer les exercices</Text>
        </TouchableOpacity>

        <Text style={styles.note}>
          💡 Les exercices vous permettent d'apprendre et de mémoriser ces mots
          grâce à la répétition espacée.
        </Text>
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
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  infoBox: {
    backgroundColor: '#f8f8f8',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  infoText: {
    fontSize: 16,
    marginBottom: 8,
  },
  wordsList: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  wordsListTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  wordPreview: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  wordText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  wordDefinition: {
    fontSize: 14,
    color: '#666',
    marginLeft: 16,
  },
  moreWords: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 8,
  },
  startButton: {
    backgroundColor: '#58CC02',
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
  note: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default LearningScreen;
