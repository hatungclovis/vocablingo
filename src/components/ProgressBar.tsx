import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Animated, Easing } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Colors } from '../theme/colors';

interface Props {
  current: number;
  total: number;
  showLabel?: boolean;
  color?: string;
  height?: number;
  animate?: boolean;
}

const ProgressBar: React.FC<Props> = ({
  current,
  total,
  showLabel = true,
  color,
  height = 10,
  animate = true,
}) => {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const fillColor = color ?? colors.primary;
  const ratio = total > 0 ? Math.min(1, Math.max(0, current / total)) : 0;

  const widthAnim = useRef(new Animated.Value(ratio)).current;

  useEffect(() => {
    if (animate) {
      Animated.timing(widthAnim, {
        toValue: ratio,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    } else {
      widthAnim.setValue(ratio);
    }
  }, [ratio, animate, widthAnim]);

  const widthInterpolation = widthAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.wrapper}>
      <View style={[styles.track, { height }]}>
        <Animated.View
          style={[
            styles.fill,
            { width: widthInterpolation, backgroundColor: fillColor, height },
          ]}
        />
      </View>
      {showLabel && (
        <Text style={styles.label}>
          {current} / {total}
        </Text>
      )}
    </View>
  );
};

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    wrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    track: {
      flex: 1,
      backgroundColor: c.border,
      borderRadius: 999,
      overflow: 'hidden',
    },
    fill: {
      borderRadius: 999,
    },
    label: {
      fontSize: 12,
      color: c.textMuted,
      fontVariant: ['tabular-nums'],
      minWidth: 48,
      textAlign: 'right',
    },
  });

export default ProgressBar;
