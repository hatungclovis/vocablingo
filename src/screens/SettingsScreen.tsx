import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useTheme, ThemeMode } from '../theme/ThemeContext';
import { getUserStats, updateUserStats } from '../services/database';
import { Colors } from '../theme/colors';

const THEME_OPTIONS: { value: ThemeMode; label: string; emoji: string }[] = [
  { value: 'system', label: 'Système', emoji: '⚙️' },
  { value: 'light', label: 'Clair', emoji: '☀️' },
  { value: 'dark', label: 'Sombre', emoji: '🌙' },
];

const DAILY_GOAL_OPTIONS = [5, 10, 20, 50];

const SettingsScreen: React.FC = () => {
  const { mode, colors, setMode } = useTheme();
  const [dailyGoal, setDailyGoal] = useState(5);

  useEffect(() => {
    (async () => {
      const stats = await getUserStats();
      if (stats?.daily_goal) setDailyGoal(stats.daily_goal);
    })();
  }, []);

  const handleSetGoal = async (g: number) => {
    setDailyGoal(g);
    await updateUserStats({ daily_goal: g });
  };

  const handleResetProgress = () => {
    Alert.alert(
      'Réinitialiser la progression ?',
      'Tu perdras tous tes XP, ton streak, tes trophées et tes statistiques de révision. Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Réinitialiser',
          style: 'destructive',
          onPress: async () => {
            try {
              const { resetUserProgress } = await import('../services/database');
              await resetUserProgress();
              Alert.alert('Progression réinitialisée');
            } catch (e) {
              Alert.alert('Erreur', 'Impossible de réinitialiser.');
            }
          },
        },
      ]
    );
  };

  const styles = makeStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Section title="Apparence" colors={colors}>
          <View style={styles.optionsRow}>
            {THEME_OPTIONS.map((opt) => {
              const active = mode === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.optionButton,
                    active && { backgroundColor: colors.primary },
                  ]}
                  onPress={() => setMode(opt.value)}
                >
                  <Text style={styles.optionEmoji}>{opt.emoji}</Text>
                  <Text
                    style={[
                      styles.optionLabel,
                      active && { color: colors.textOnPrimary, fontWeight: 'bold' },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Section>

        <Section title="Objectif quotidien" colors={colors}>
          <Text style={styles.subText}>
            Combien d'exercices vises-tu chaque jour ?
          </Text>
          <View style={styles.optionsRow}>
            {DAILY_GOAL_OPTIONS.map((g) => {
              const active = dailyGoal === g;
              return (
                <TouchableOpacity
                  key={g}
                  style={[
                    styles.optionButton,
                    active && { backgroundColor: colors.primary },
                  ]}
                  onPress={() => handleSetGoal(g)}
                >
                  <Text
                    style={[
                      styles.optionLabel,
                      active && { color: colors.textOnPrimary, fontWeight: 'bold' },
                    ]}
                  >
                    {g}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Section>

        <Section title="Données" colors={colors}>
          <TouchableOpacity
            style={[styles.dangerButton, { borderColor: colors.danger }]}
            onPress={handleResetProgress}
          >
            <Text style={[styles.dangerButtonText, { color: colors.danger }]}>
              Réinitialiser toute la progression
            </Text>
          </TouchableOpacity>
        </Section>

        <Text style={styles.version}>Vocablingo · 0.1.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const Section: React.FC<{
  title: string;
  colors: Colors;
  children: React.ReactNode;
}> = ({ title, colors, children }) => (
  <View style={{ marginBottom: 28 }}>
    <Text
      style={{
        fontSize: 12,
        fontWeight: 'bold',
        color: colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 10,
      }}
    >
      {title}
    </Text>
    {children}
  </View>
);

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
    },
    scroll: {
      padding: 20,
    },
    subText: {
      fontSize: 13,
      color: c.textSecondary,
      marginBottom: 10,
    },
    optionsRow: {
      flexDirection: 'row',
      gap: 8,
      flexWrap: 'wrap',
    },
    optionButton: {
      flexGrow: 1,
      flexBasis: 80,
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderRadius: 10,
      backgroundColor: c.surface,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: c.border,
    },
    optionEmoji: {
      fontSize: 22,
      marginBottom: 4,
    },
    optionLabel: {
      fontSize: 14,
      color: c.text,
    },
    dangerButton: {
      borderWidth: 2,
      borderRadius: 12,
      padding: 14,
      alignItems: 'center',
    },
    dangerButtonText: {
      fontSize: 14,
      fontWeight: 'bold',
    },
    version: {
      textAlign: 'center',
      color: c.textMuted,
      fontSize: 12,
      marginTop: 16,
    },
  });

export default SettingsScreen;
