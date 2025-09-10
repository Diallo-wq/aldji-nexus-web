import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { LineChart } from 'react-native-chart-kit';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../utils/constants';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  variant?: 'default' | 'gradient' | 'glass' | 'elevated';
  onPress?: () => void;
  style?: any;
  headerStyle?: any;
  contentStyle?: any;
  padding?: 'none' | 'small' | 'medium' | 'large';
  shadow?: boolean;
  animated?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  variant = 'default',
  onPress,
  style,
  headerStyle,
  contentStyle,
  padding = 'medium',
  shadow = true,
  animated = true,
}) => {
  const paddingStyle = {
    none: { padding: 0 },
    small: { padding: SPACING.sm },
    medium: { padding: SPACING.md },
    large: { padding: SPACING.lg },
  }[padding];

  const cardStyles = [
    styles.card,
    styles[variant],
    shadow && styles.shadow,
    animated && styles.animated,
    paddingStyle,
    style,
  ];

  const CardContent = () => (
    <View style={cardStyles}>
      {(title || subtitle) && (
        <View style={[styles.header, headerStyle]}>
          {title && <Text style={styles.title}>{title}</Text>}
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      )}
      <View style={[styles.content, contentStyle]}>
        {children}
      </View>
    </View>
  );

  if (variant === 'gradient') {
    return (
      <LinearGradient
        colors={[COLORS.gradientStart, COLORS.gradientEnd]}
        style={[styles.card, shadow && styles.shadow, animated && styles.animated, style]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {(title || subtitle) && (
          <View style={[styles.header, styles.gradientHeader, headerStyle]}>
            {title && <Text style={[styles.title, styles.gradientTitle]}>{title}</Text>}
            {subtitle && <Text style={[styles.subtitle, styles.gradientSubtitle]}>{subtitle}</Text>}
          </View>
        )}
        <View style={[styles.content, contentStyle, paddingStyle]}>
          {children}
        </View>
      </LinearGradient>
    );
  }

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          cardStyles,
          pressed && styles.pressed,
        ]}
      >
        <CardContent />
      </Pressable>
    );
  }

  return <CardContent />;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.surface,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        transition: 'all 0.2s ease-in-out',
      },
    }),
  },
  default: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  gradient: {
    // Styles appliqués via LinearGradient
  },
  glass: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
      },
    }),
  },
  elevated: {
    backgroundColor: COLORS.surface,
    borderWidth: 0,
  },
  shadow: {
    ...Platform.select({
      ios: {
        shadowColor: COLORS.black,
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
    }),
  },
  animated: {
    ...Platform.select({
      web: {
        cursor: 'pointer' as any,
      },
    }),
  },
  pressed: {
    opacity: 0.95,
    transform: [{ scale: 0.98 }],
  },
  header: {
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    marginBottom: SPACING.md,
  },
  gradientHeader: {
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  title: {
    fontSize: FONTS.sizes.lg,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  gradientTitle: {
    color: COLORS.white,
  },
  subtitle: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  gradientSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  content: {
    flex: 1,
  },
});

// Composants spécialisés pour des cas d'usage courants
export const StatsCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: string;
  onPress?: () => void;
  style?: any;
  // Nouveau: bouton de pied de carte
  footerButtonTitle?: string;
  footerButtonOnPress?: () => void;
  // Nouveau: mini sparkline
  sparklineData?: number[];
  sparklineLabels?: string[];
  sparklineColor?: string;
  // Nouveau: lien de pied de carte (ex: "Voir plus")
  footerLinkTitle?: string;
  footerLinkOnPress?: () => void;
  // Nouveau: suppression du conteneur Card pour éviter l'effet card-dans-card
  flat?: boolean;
}> = ({ title, value, subtitle, icon, trend, trendValue, color = COLORS.primary, onPress, style, footerButtonTitle, footerButtonOnPress, sparklineData, sparklineLabels, sparklineColor, footerLinkTitle, footerLinkOnPress, flat = false }) => {
  const trendColor = {
    up: COLORS.success,
    down: COLORS.error,
    neutral: COLORS.textSecondary,
  }[trend || 'neutral'];
  const [sparkWidth, setSparkWidth] = useState(0);

  const Inner = (
    <View style={statsStyles.container}>
      <View style={statsStyles.header}>
        {icon && (
          <View style={[statsStyles.iconContainer, { backgroundColor: color + '20' }]}>
            {icon}
          </View>
        )}
        <View style={statsStyles.titleContainer}>
          <Text style={statsStyles.title}>{title}</Text>
          {subtitle && <Text style={statsStyles.subtitle}>{subtitle}</Text>}
        </View>
      </View>
      
      <View style={statsStyles.valueContainer}>
        <Text style={[statsStyles.value, { color }]}>{value}</Text>
        {trend && trendValue && (
          <Text style={[statsStyles.trend, { color: trendColor }]}>
            {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'} {trendValue}
          </Text>
        )}
      </View>

      {sparklineData && sparklineData.length > 0 && (
        <View style={statsStyles.sparkWrapper} onLayout={(e) => setSparkWidth(e.nativeEvent.layout.width)}>
          {sparkWidth > 0 ? (
            <LineChart
              data={{
                labels: sparklineLabels || new Array(sparklineData.length).fill(''),
                datasets: [{ data: sparklineData, strokeWidth: 2 }],
              }}
              width={Math.max(160, sparkWidth)}
              height={60}
              withInnerLines={false}
              withOuterLines={false}
              withVerticalLabels={false}
              withHorizontalLabels={false}
              chartConfig={{
                backgroundColor: 'transparent',
                backgroundGradientFrom: 'transparent',
                backgroundGradientTo: 'transparent',
                decimalPlaces: 0,
                color: (o=1) => (sparklineColor || '#007BFF'),
                labelColor: () => 'transparent',
                fillShadowGradient: sparklineColor || '#007BFF',
                fillShadowGradientOpacity: 0.12,
                propsForDots: { r: '3', strokeWidth: '0', fill: '#6c757d' },
              }}
              bezier
              style={{ marginLeft: -6 }}
            />
          ) : (
            <View style={statsStyles.sparkTrack} />
          )}
        </View>
      )}

      {(footerLinkTitle || footerButtonTitle) && (
        <View style={statsStyles.footerRow}>
          {footerLinkTitle && (
            <Pressable onPress={footerLinkOnPress} style={statsStyles.footerLinkWrapper}>
              <Text style={statsStyles.footerLinkText}>{footerLinkTitle}</Text>
            </Pressable>
          )}
          {footerButtonTitle && (
            <Pressable onPress={footerButtonOnPress} style={[statsStyles.footerButton, !footerLinkTitle && { width: '100%' }, { backgroundColor: COLORS.primary }] }>
              <Text style={statsStyles.footerButtonText}>{footerButtonTitle}</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );

  if (flat) {
    // Rendu sans Card conteneur (fond/transparence; aucun shadow/border)
    return (
      <View
        style={[
          { backgroundColor: 'transparent', borderWidth: 0, borderRadius: 0 },
          Platform.select({ web: { boxShadow: 'none' } }),
          style,
        ]}
      >
        {Inner}
      </View>
    );
  }

  return (
    <Card variant="elevated" onPress={onPress} animated style={style}>
      {Inner}
    </Card>
  );
};

const statsStyles = StyleSheet.create({
  container: {
    padding: SPACING.md,
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: FONTS.sizes.base,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
  },
  subtitle: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  value: {
    fontSize: FONTS.sizes['2xl'],
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  trend: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.medium,
  },
  sparkWrapper: {
    marginTop: SPACING.md,
  },
  sparkTrack: {
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.borderLight,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
  },
  footerLinkWrapper: {
    marginTop: SPACING.sm,
  },
  footerLinkText: {
    color: COLORS.primary,
    fontFamily: FONTS.medium,
    fontSize: FONTS.sizes.sm,
  },
  footerButton: {
    marginTop: 0,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: 10,
    alignItems: 'center',
  },
  footerButtonText: {
    color: COLORS.white,
    fontFamily: FONTS.semiBold,
  },
});

export const ActionCard: React.FC<{
  title: string;
  description: string;
  icon?: React.ReactNode;
  action: string;
  onPress: () => void;
  variant?: 'default' | 'primary' | 'success' | 'warning';
}> = ({ title, description, icon, action, onPress, variant = 'default' }) => {
  const variantColors = {
    default: COLORS.primary,
    primary: COLORS.primary,
    success: COLORS.success,
    warning: COLORS.warning,
  };

  const color = variantColors[variant];

  return (
    <Card onPress={onPress} animated>
      <View style={actionStyles.container}>
        <View style={actionStyles.content}>
          {icon && (
            <View style={[actionStyles.iconContainer, { backgroundColor: color + '20' }]}>
              {icon}
            </View>
          )}
          <View style={actionStyles.textContainer}>
            <Text style={actionStyles.title}>{title}</Text>
            <Text style={actionStyles.description}>{description}</Text>
          </View>
        </View>
        <Text style={[actionStyles.action, { color }]}>{action}</Text>
      </View>
    </Card>
  );
};

const actionStyles = StyleSheet.create({
  container: {
    padding: SPACING.md,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: FONTS.sizes.base,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  description: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  action: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.medium,
    textAlign: 'right',
  },
});
