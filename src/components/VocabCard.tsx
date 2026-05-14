import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Colors } from '../theme/colors';
import { Word } from '../types';

interface Props {
  word: Word;
  onInfoPress?: () => void;
}

const VocabCard: React.FC<Props> = ({ word, onInfoPress }) => {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const Section: React.FC<{ title: string; children: React.ReactNode }> = ({
    title,
    children,
  }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  return (
    <ScrollView
      style={styles.card}
      contentContainerStyle={styles.cardContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.word}>{word.word}</Text>
        <View style={styles.headerRight}>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>{word.level}</Text>
          </View>
          {onInfoPress && (
            <TouchableOpacity onPress={onInfoPress} style={styles.infoButton}>
              <Text style={styles.infoIcon}>ⓘ</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Text style={styles.definition}>{word.definition}</Text>

      {word.examples.length > 0 && (
        <Section title="Exemples">
          {word.examples.map((ex, i) => (
            <Text key={i} style={styles.example}>
              « {ex} »
            </Text>
          ))}
        </Section>
      )}

      {word.synonyms.length > 0 && (
        <Section title="Synonymes">
          <Text style={styles.tagsLine}>{word.synonyms.join(' · ')}</Text>
        </Section>
      )}

      {word.antonyms.length > 0 && (
        <Section title="Antonymes">
          <Text style={styles.tagsLine}>{word.antonyms.join(' · ')}</Text>
        </Section>
      )}
    </ScrollView>
  );
};

const makeStyles = (c: Colors) => StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: c.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: c.border,
  },
  cardContent: {
    padding: 20,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  word: {
    fontSize: 32,
    fontWeight: 'bold',
    color: c.text,
    flexShrink: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 12,
  },
  levelBadge: {
    backgroundColor: c.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  levelText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  infoButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoIcon: {
    fontSize: 22,
    color: c.info,
  },
  definition: {
    fontSize: 18,
    color: c.textSecondary,
    lineHeight: 26,
    marginBottom: 20,
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: c.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  example: {
    fontSize: 15,
    color: c.textSecondary,
    fontStyle: 'italic',
    lineHeight: 22,
    marginBottom: 4,
  },
  tagsLine: {
    fontSize: 15,
    color: c.textSecondary,
    lineHeight: 22,
  },
});

export default VocabCard;
