import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Theme, Word } from '../types';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import ThemesScreen from '../screens/ThemesScreen';
import LearningScreen from '../screens/LearningScreen';
import ReviewScreen from '../screens/ReviewScreen';
import ExerciseScreen from '../screens/ExerciseScreen';
import ProgressScreen from '../screens/ProgressScreen';

// Define navigation types
export type RootStackParamList = {
  Home: undefined;
  Themes: undefined;
  Learning: { theme: Theme };
  Review: undefined;
  Exercise: { words: Word[]; themeId?: number };
  Progress: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#58CC02',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'Vocalingo 🇫🇷' }}
        />
        <Stack.Screen
          name="Themes"
          component={ThemesScreen}
          options={{ title: 'Thèmes' }}
        />
        <Stack.Screen
          name="Learning"
          component={LearningScreen}
          options={{ title: 'Apprentissage' }}
        />
        <Stack.Screen
          name="Review"
          component={ReviewScreen}
          options={{ title: 'Révision' }}
        />
        <Stack.Screen
          name="Exercise"
          component={ExerciseScreen}
          options={{ title: 'Exercice' }}
        />
        <Stack.Screen
          name="Progress"
          component={ProgressScreen}
          options={{ title: 'Progression' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
