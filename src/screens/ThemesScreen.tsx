import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Theme } from '../types';
import { getAllThemes, getWordsByTheme, getAllProgress } from '../services/database';

type ThemesScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Themes'>;

interface Props {
  navigation: ThemesScreenNavigationProp;
}

interface ThemeWithProgress extends Theme {
  wordsLearned: number;
  totalWords: number;
  progressPercentage: number;
}

const ThemesScreen: React.FC<Props> = ({ navigation }) => {
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

          const progressPercentage =
            words.length > 0 ? Math.round((learnedCount / words.length) * 100) : 0;

          return {
            ...theme,
            wordsLearned: learnedCount,
            totalWords: words.length,
            progressPercentage,
          };
        })
      );

      setThemes(themesWithProgress);
    } catch (error) {
      console.error('Error loading themes:', error);
    }
  };

  const getIconForTheme = (iconName: string): string => {
    const iconMap: { [key: string]: string } = {
      briefcase: '💼',
      'chat-bubble': '💬',
      glasses: '👓',
      layers: '📚',
      heart: '❤️',
    };
    return iconMap[iconName] || '📖';
  };

  const renderThemeCard = ({ item }: { item: ThemeWithProgress }) => (
    <TouchableOpacity
      style={styles.themeCard}
      onPress={() => navigation.navigate('Learning', { theme: item })}
    >
      <View style={styles.themeHeader}>
        <Text style={styles.themeIcon}>{getIconForTheme(item.icon)}</Text>
        <View style={styles.themeInfo}>
          <Text style={styles.themeName}>{item.name}</Text>
          <Text style={styles.themeDescription}>{item.description}</Text>
        </View>
      </View>

      <View style={styles.themeStats}>
        <Text style={styles.themeStatsText}>
          {item.wordsLearned} / {item.totalWords} mots appris
        </Text>
        <View style={styles.progressBarContainer}>
          <View
            style={[styles.progressBar, { width: `${item.progressPercentage}%` }]}
          />
        </View>
        <Text style={styles.progressPercentage}>{item.progressPercentage}%</Text>
      </View>
    </TouchableOpacity>
  );

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
        renderItem={renderThemeCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  listContent: {
    padding: 16,
  },
  themeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  themeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  themeIcon: {
    fontSize: 40,
    marginRight: 12,
  },
  themeInfo: {
    flex: 1,
  },
  themeName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  themeDescription: {
    fontSize: 14,
    color: '#666',
  },
  themeStats: {
    marginTop: 8,
  },
  themeStatsText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#58CC02',
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 12,
    color: '#58CC02',
    fontWeight: 'bold',
    textAlign: 'right',
  },
});

export default ThemesScreen;
