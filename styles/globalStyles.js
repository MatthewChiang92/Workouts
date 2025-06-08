import { Dimensions, PixelRatio, Platform } from 'react-native';

const { width } = Dimensions.get('window');
const scale = width / 375;
const fontScale = PixelRatio.getFontScale();

// Normalize sizes across different devices
export const normalize = (size, respectFontScale = true) => {
  const newSize = Math.round(size * scale);
  if (respectFontScale) {
    return Math.round(newSize * fontScale);
  }
  return newSize;
};

// Color palette
export const colors = {
  background: '#000000',
  card: '#1c1c1e',
  text: {
    primary: '#ffffff',
    secondary: '#888888',
    accent: '#a29bfe',
    danger: '#FF3B30',
  },
  button: {
    primary: '#007AFF',
    secondary: '#333333',
    accent: '#a29bfe',
    danger: '#FF3B30',
  },
  border: '#333333',
  statusBar: '#000000',
  activeDot: '#a29bfe',
};

// Typography
export const typography = {
  header: {
    fontSize: normalize(28, true),
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  title: {
    fontSize: normalize(24, true),
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: normalize(18, true),
    color: colors.text.secondary,
  },
  body: {
    fontSize: normalize(16, true),
    color: colors.text.primary,
  },
  caption: {
    fontSize: normalize(14, true),
    color: colors.text.secondary,
  },
  button: {
    fontSize: normalize(16, true),
    fontWeight: '500',
    color: colors.text.primary,
  },
};

// Spacing
export const spacing = {
  xs: normalize(4, false),
  sm: normalize(8, false),
  md: normalize(16, false),
  lg: normalize(24, false),
  xl: normalize(32, false),
  xxl: normalize(48, false),
};

// Border radiuses
export const borderRadius = {
  sm: normalize(4, false),
  md: normalize(8, false),
  lg: normalize(12, false),
  xl: normalize(20, false),
  circle: normalize(999, false),
};

// Layout
export const layout = {
  screenPadding: spacing.md,
  cardPadding: spacing.md,
  containerWidth: '100%',
};

// Common component styles
export const commonStyles = {
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: spacing.xl,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  section: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spaceBetween: {
    justifyContent: 'space-between',
  },
  button: {
    primary: {
      backgroundColor: colors.button.primary,
      padding: spacing.md,
      borderRadius: borderRadius.md,
      alignItems: 'center',
      width: '100%',
    },
    accent: {
      backgroundColor: colors.button.accent,
      padding: spacing.md,
      borderRadius: borderRadius.md,
      alignItems: 'center',
      width: '100%',
    },
    danger: {
      backgroundColor: colors.button.danger,
      padding: spacing.md,
      borderRadius: borderRadius.md,
      alignItems: 'center',
      width: '100%',
    },
  },
  shadow: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  screenHeader: {
    paddingTop: Platform.OS === 'ios' ? normalize(50, false) : normalize(20, false),
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  section: {
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
}; 