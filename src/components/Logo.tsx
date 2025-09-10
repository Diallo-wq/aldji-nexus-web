import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { COLORS, FONTS, BORDER_RADIUS } from '../utils/constants';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ 
  size = 'medium', 
  showText = true 
}) => {
  const getSize = () => {
    switch (size) {
      case 'small':
        return { width: 40, height: 40, fontSize: 12 };
      case 'large':
        return { width: 80, height: 80, fontSize: 24 };
      default:
        return { width: 60, height: 60, fontSize: 18 };
    }
  };

  const { width, height, fontSize } = getSize();

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/icon.png')}
        style={[styles.logoImage, { width, height }]}
        resizeMode="contain"
        accessibilityLabel="OMEX logo"
      />
      
      {showText && (
        <View style={styles.textContainer}>
          <Text style={[styles.brandText, { fontSize: fontSize * 0.8 }]}>OMEX</Text>
          <Text style={[styles.subText, { fontSize: fontSize * 0.4 }]}>Gestion Commerciale</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoImage: {
    borderRadius: BORDER_RADIUS.lg,
    ...COLORS.shadows.md,
  },
  textContainer: {
    marginLeft: 12,
  },
  brandText: {
    color: COLORS.primary,
    fontFamily: FONTS.bold,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  subText: {
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
});
