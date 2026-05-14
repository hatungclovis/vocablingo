import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Word } from '../types';
import { searchWords } from '../services/database';
import { useTheme } from '../theme/ThemeContext';
import { Colors } from '../theme/colors';

type Nav = StackNavigationProp<RootStackParamList, 'Search'>;

interface Props {
  navigation: Nav;
}

const SearchScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Word[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const handle = setTimeout(async () => {
      setSearching(true);
      try {
        const found = await searchWords(query);
        setResults(found);
      } finally {
        setSearching(false);
      }
    }, 200);
    return () => clearTimeout(handle);
  }, [query]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.input}
          placeholder="Rechercher un mot ou une définition…"
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
          autoFocus
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Text style={styles.clearButton}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {searching && (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      )}

      {!searching && query.trim().length >= 2 && results.length === 0 && (
        <View style={styles.center}>
          <Text style={styles.emptyText}>Aucun résultat pour « {query} »</Text>
        </View>
      )}

      {!searching && query.trim().length < 2 && (
        <View style={styles.center}>
          <Text style={styles.emptyText}>
            Tape au moins 2 caractères pour chercher.
          </Text>
        </View>
      )}

      <FlatList
        data={results}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate('WordDetail', { word: item })}
          >
            <View style={styles.rowMain}>
              <Text style={styles.rowWord}>{item.word}</Text>
              <Text style={styles.rowDef} numberOfLines={2}>
                {item.definition}
              </Text>
            </View>
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>{item.level}</Text>
            </View>
          </TouchableOpacity>
        )}
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
    searchBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.surface,
      margin: 16,
      paddingHorizontal: 12,
      borderRadius: 12,
      gap: 8,
    },
    searchIcon: {
      fontSize: 18,
    },
    input: {
      flex: 1,
      fontSize: 16,
      paddingVertical: 12,
      color: c.text,
    },
    clearButton: {
      fontSize: 18,
      color: c.textMuted,
      paddingHorizontal: 6,
    },
    center: {
      paddingVertical: 32,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 14,
      color: c.textMuted,
      textAlign: 'center',
      paddingHorizontal: 24,
    },
    listContent: {
      paddingHorizontal: 16,
      paddingBottom: 24,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: c.divider,
      gap: 12,
    },
    rowMain: {
      flex: 1,
    },
    rowWord: {
      fontSize: 16,
      fontWeight: 'bold',
      color: c.text,
    },
    rowDef: {
      fontSize: 13,
      color: c.textMuted,
      marginTop: 2,
    },
    levelBadge: {
      backgroundColor: c.primary,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 999,
    },
    levelText: {
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 11,
    },
  });

export default SearchScreen;
