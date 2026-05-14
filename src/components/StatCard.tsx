import React from 'react';
import { StyleSheet, View, Text, ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Colors } from '../theme/colors';

interface Props {
  value: string | number;
  label: string;
  variant?: 'card' | 'plain';
  valueColor?: string;
  style?: ViewStyle;
}

const StatCard: React.FC<Props> = ({
  value,
  label,
  variant = 'card',
  valueColor,
  style,
}) => {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const resolvedValueColor = valueColor ?? colors.primary;
  return (
    <View style={[styles.base, variant === 'card' && styles.card, style]}>
      <Text style={[styles.value, { color: resolvedValueColor }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
};

const makeStyles = (c: Colors) => StyleSheet.create({
  base: {
    alignItems: 'center',
  },
  card: {
    backgroundColor: c.surface,
    padding: 16,
    borderRadius: 12,
  },
  value: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  label: {
    fontSize: 12,
    color: c.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
});

export default StatCard;
