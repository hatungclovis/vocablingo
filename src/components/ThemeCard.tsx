import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Colors } from '../theme/colors';
import { Theme } from '../types';
import ProgressBar from './ProgressBar';

interface Props {
  theme: Theme;
  wordsLearned: number;
  totalWords: number;
  onPress: () => void;
}

const ICON_MAP: { [key: string]: string } = {
  briefcase: '💼',
  'chat-bubble': '💬',
  glasses: '👓',
  layers: '📚',
  heart: '❤️',
};

const getIcon = (icon: string): string => ICON_MAP[icon] || '📖';

const ThemeCard: React.FC<Props> = ({
  theme,
  wordsLearned,
  totalWords,
  onPress,
}) => {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const percentage =
    totalWords > 0 ? Math.round((wordsLearned / totalWords) * 100) : 0;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.icon}>{getIcon(theme.icon)}</Text>
        <View style={styles.info}>
          <Text style={styles.name}>{theme.name}</Text>
          <Text style={styles.description}>{theme.description}</Text>
        </View>
      </View>

      <View style={styles.stats}>
        <Text style={styles.statsText}>
          {wordsLearned} / {totalWords} mots appris
        </Text>
        <ProgressBar
          current={wordsLearned}
          total={totalWords}
          showLabel={false}
          height={8}
        />
        <Text style={styles.percentage}>{percentage}%</Text>
      </View>
    </TouchableOpacity>
  );
};

const makeStyles = (c: Colors) => StyleSheet.create({
  card: {
    backgroundColor: c.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: c.border,
    shadowColor: c.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    fontSize: 40,
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: c.textMuted,
  },
  stats: {
    marginTop: 8,
  },
  statsText: {
    fontSize: 14,
    color: c.textMuted,
    marginBottom: 8,
  },
  percentage: {
    fontSize: 12,
    color: c.primary,
    fontWeight: 'bold',
    textAlign: 'right',
    marginTop: 4,
  },
});

export default ThemeCard;
