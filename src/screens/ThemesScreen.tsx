import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  SafeAreaView,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Theme } from '../types';
import { getAllThemes, getWordsByTheme, getAllProgress } from '../services/database';
import ThemeCard from '../components/ThemeCard';
import { useTheme } from '../theme/ThemeContext';
import { Colors } from '../theme/colors';

type ThemesScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Themes'>;

interface Props {
  navigation: ThemesScreenNavigationProp;
}

interface ThemeWithProgress extends Theme {
  wordsLearned: number;
  totalWords: number;
}

const ThemesScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const [themes, setThemes] = useState<ThemeWithProgress[]>([]);

  useEffect(() => {
    loadThemes();
  }, []);

  const loadThemes = async () => {
    try {
      const [allThemes, progressMap] = await Promise.all([
        getAllThemes(),
        getAllProgress(),
      ]);

      const themesWithProgress: ThemeWithProgress[] = await Promise.all(
        allThemes.map(async (theme) => {
          const words = await getWordsByTheme(theme.id);
          let learnedCount = 0;

          for (const word of words) {
            const progress = progressMap.get(word.id);
            if (progress && progress.times_seen > 0) {
              learnedCount++;
            }
          }

          return {
            ...theme,
            wordsLearned: learnedCount,
            totalWords: words.length,
          };
        })
      );

      setThemes(themesWithProgress);
    } catch (error) {
      console.error('Error loading themes:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Choisissez un thème</Text>
        <Text style={styles.headerSubtitle}>
          Explorez différentes catégories de vocabulaire
        </Text>
      </View>

      <FlatList
        data={themes}
        renderItem={({ item }) => (
          <ThemeCard
            theme={item}
            wordsLearned={item.wordsLearned}
            totalWords={item.totalWords}
            onPress={() => navigation.navigate('Learning', { theme: item })}
          />
        )}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
};

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
    },
    header: {
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: c.divider,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 4,
      color: c.text,
    },
    headerSubtitle: {
      fontSize: 14,
      color: c.textMuted,
    },
    listContent: {
      padding: 16,
    },
  });

export default ThemesScreen;
