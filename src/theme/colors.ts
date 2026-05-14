export interface Colors {
  // Surfaces
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  divider: string;

  // Texte
  text: string;
  textSecondary: string;
  textMuted: string;
  textOnPrimary: string;

  // Couleurs sémantiques
  primary: string; // vert principal (correct, learn)
  primaryHighlight: string; // bg vert clair
  info: string; // bleu (review, search)
  infoHighlight: string;
  warning: string; // orange
  warningHighlight: string;
  danger: string; // rouge
  dangerHighlight: string;
  success: string;
  successHighlight: string;

  // Niveaux maîtrise
  masteryNew: string;
  masteryLearning: string;
  masteryReview: string;
  masteryMastered: string;

  // États
  shadow: string;
}

export const lightColors: Colors = {
  background: '#ffffff',
  surface: '#f8f8f8',
  surfaceAlt: '#fafafa',
  border: '#e0e0e0',
  divider: '#eeeeee',

  text: '#1a1a1a',
  textSecondary: '#555555',
  textMuted: '#888888',
  textOnPrimary: '#ffffff',

  primary: '#58CC02',
  primaryHighlight: '#E8F5E9',
  info: '#1CB0F6',
  infoHighlight: '#E8F4FD',
  warning: '#FF9600',
  warningHighlight: '#FFF3CD',
  danger: '#FF4B4B',
  dangerHighlight: '#FFEBEE',
  success: '#2E7D32',
  successHighlight: '#E8F5E9',

  masteryNew: '#bdbdbd',
  masteryLearning: '#FFB800',
  masteryReview: '#1CB0F6',
  masteryMastered: '#58CC02',

  shadow: '#000000',
};

export const darkColors: Colors = {
  background: '#121212',
  surface: '#1e1e1e',
  surfaceAlt: '#252525',
  border: '#333333',
  divider: '#2a2a2a',

  text: '#f0f0f0',
  textSecondary: '#bdbdbd',
  textMuted: '#888888',
  textOnPrimary: '#ffffff',

  primary: '#7FE03A',
  primaryHighlight: '#1f3a1a',
  info: '#41C0FA',
  infoHighlight: '#16344a',
  warning: '#FFAA33',
  warningHighlight: '#3e2d10',
  danger: '#FF6B6B',
  dangerHighlight: '#3a1a1a',
  success: '#7FE03A',
  successHighlight: '#1f3a1a',

  masteryNew: '#555555',
  masteryLearning: '#FFB800',
  masteryReview: '#41C0FA',
  masteryMastered: '#7FE03A',

  shadow: '#000000',
};
