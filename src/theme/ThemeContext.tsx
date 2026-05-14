import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Appearance } from 'react-native';
import { Colors, lightColors, darkColors } from './colors';
import { getUserStats, updateUserStats } from '../services/database';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  mode: ThemeMode;
  colors: Colors;
  isDark: boolean;
  setMode: (mode: ThemeMode) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const resolveScheme = (mode: ThemeMode): 'light' | 'dark' => {
  if (mode === 'system') {
    return Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
  }
  return mode;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [systemScheme, setSystemScheme] = useState(Appearance.getColorScheme());

  // Charger la préférence persistée
  useEffect(() => {
    (async () => {
      try {
        const stats = await getUserStats();
        const pref = (stats?.theme_preference as ThemeMode) ?? 'system';
        if (['light', 'dark', 'system'].includes(pref)) {
          setModeState(pref);
        }
      } catch (e) {
        // base pas encore prête, on garde system
      }
    })();
  }, []);

  // Réagir au changement du thème système
  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme);
    });
    return () => sub.remove();
  }, []);

  const effective = mode === 'system'
    ? (systemScheme === 'dark' ? 'dark' : 'light')
    : mode;
  const colors = effective === 'dark' ? darkColors : lightColors;

  const setMode = async (next: ThemeMode) => {
    setModeState(next);
    try {
      await updateUserStats({ theme_preference: next });
    } catch (e) {
      console.error('Error saving theme preference:', e);
    }
  };

  const value = useMemo(
    () => ({ mode, colors, isDark: effective === 'dark', setMode }),
    [mode, colors, effective]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
};

export const useColors = (): Colors => useTheme().colors;
