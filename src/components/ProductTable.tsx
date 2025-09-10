import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '../types';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../utils/constants';
import { useFormatAmount } from '../utils/format';

interface ProductTableProps {
  products: Product[];
  onProductPress?: (product: Product) => void;
  onDeleteProduct?: (product: Product) => void;
}

export const ProductTable: React.FC<ProductTableProps> = ({ 
  products, 
  onProductPress,
  onDeleteProduct,
}) => {
  const { width } = useWindowDimensions();
  const isSmall = width < 600;
  const getStatusColor = (quantity: number, minQuantity: number) => {
    if (quantity <= minQuantity) return '#ef4444';
    return '#10b981';
  };

  const getStatusText = (quantity: number, minQuantity: number) => {
    if (quantity <= minQuantity) return 'Inactive';
    return 'Active';
  };

  const getProductEmoji = (category: string | undefined) => {
    switch (category) {
      case 'Informatique':
        return '💻';
      case 'Téléphonie':
        return '📱';
      case 'Audio':
        return '🎧';
      default:
        return '📦';
    }
  };

  const formatAmountDynamic = useFormatAmount();

  if (isSmall) {
    return (
      <View style={styles.cardListContainer}>
        {products.map((product) => {
          const statusColor = getStatusColor(product.quantity, product.minQuantity);
          const cap = Math.max(product.minQuantity * 2, product.quantity || 0, 1);
          const progress = Math.min(product.quantity / cap, 1);
          return (
            <TouchableOpacity key={product.id} style={styles.cardItem} onPress={() => onProductPress?.(product)}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  {product.imageUrl ? (
                    <Image source={{ uri: product.imageUrl }} style={styles.cardImage} resizeMode="cover" />
                  ) : (
                    <View style={styles.cardEmojiWrap}>
                      <Text style={styles.cardEmoji}>{getProductEmoji(product.category)}</Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{product.name}</Text>
                    <Text style={styles.cardSubtitle} numberOfLines={1}>{formatAmountDynamic(product.price)}</Text>
                  </View>
                </View>
                <View style={[styles.statusPill, { backgroundColor: statusColor + '20' }]}> 
                  <Text style={[styles.statusPillText, { color: statusColor }]}>{getStatusText(product.quantity, product.minQuantity)}</Text>
                </View>
              </View>

              <View style={[styles.cardBody, { flex: 1 }]}>
                <View style={[styles.stockBadge, { backgroundColor: statusColor + '20' }]}> 
                  <Text style={[styles.stockText, { color: statusColor }]}>{product.quantity}</Text>
                </View>
                <View style={[styles.progressContainer, styles.cardProgress]}>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { flex: progress, backgroundColor: statusColor }]} />
                    <View style={[styles.progressRemainder, { flex: 1 - progress }]} />
                  </View>
                </View>
              </View>

              {onDeleteProduct && (
                <View style={styles.cardActions}>
                  <TouchableOpacity accessibilityLabel={`Supprimer ${product.name}`} onPress={() => onDeleteProduct(product)}>
                    <Ionicons name="trash-outline" size={20} color={COLORS.danger || '#ef4444'} />
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  return (
    <View style={styles.tableContainer}>
      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderText, styles.imageHeader]} allowFontScaling={false}>Image</Text>
        <Text style={[styles.tableHeaderText, styles.nameHeader, { flex: 1 }]} numberOfLines={1} ellipsizeMode="tail" allowFontScaling={false}>Nom</Text>
        <Text style={[styles.tableHeaderText, styles.priceHeader, styles.priceColWidth]} allowFontScaling={false}>Prix</Text>
        <Text style={[styles.tableHeaderText, styles.stockHeader, styles.stockColWidth]} allowFontScaling={false}>Stock</Text>
        <Text style={[styles.tableHeaderText, styles.statusHeader, styles.statusColWidth]} allowFontScaling={false}>Statut</Text>
        {onDeleteProduct && (
          <Text style={[styles.tableHeaderText, styles.actionsHeader, styles.actionsColWidth]} allowFontScaling={false}>Actions</Text>
        )}
      </View>

      {products.map((product) => (
        <View key={product.id} style={styles.tableRow}>
          <View style={[styles.imageCellContainer, styles.imageColWidth]}>
            {product.imageUrl ? (
              <Image
                source={{ uri: product.imageUrl }}
                style={styles.productImage}
                resizeMode="cover"
              />
            ) : (
              <Text style={styles.productEmoji}>{getProductEmoji(product.category)}</Text>
            )}
          </View>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => onProductPress?.(product)}>
            <Text
              style={[styles.tableCell, styles.nameCell, { flex: 1 }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {product.name}
            </Text>
          </TouchableOpacity>
          <Text style={[styles.tableCell, styles.priceCell, styles.priceColWidth]} allowFontScaling={false}>{formatAmountDynamic(product.price)}</Text>
          <View style={[styles.stockCellContainer, styles.stockColWidth]}>
            <View style={[styles.stockBadge, { backgroundColor: getStatusColor(product.quantity, product.minQuantity) + '20' }]}> 
              <Text style={[styles.stockText, { color: getStatusColor(product.quantity, product.minQuantity) }]}>
                {product.quantity}
              </Text>
            </View>
            {(() => {
              const cap = Math.max(product.minQuantity * 2, product.quantity || 0, 1);
              const progress = Math.min(product.quantity / cap, 1);
              const barColor = getStatusColor(product.quantity, product.minQuantity);
              return (
                <View style={styles.progressContainer}>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { flex: progress, backgroundColor: barColor }]} />
                    <View style={[styles.progressRemainder, { flex: 1 - progress }]} />
                  </View>
                </View>
              );
            })()}
          </View>
          <Text style={[styles.tableCell, styles.statusCell, styles.statusColWidth, { color: getStatusColor(product.quantity, product.minQuantity) }]}>
            {getStatusText(product.quantity, product.minQuantity)}
          </Text>
          {onDeleteProduct && (
            <View style={[styles.actionsColWidth, { alignItems: 'flex-end' }]}>
              <TouchableOpacity accessibilityLabel={`Supprimer ${product.name}`} onPress={() => onDeleteProduct(product)}>
                <Ionicons name="trash-outline" size={20} color={COLORS.danger || '#ef4444'} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  tableContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  cardListContainer: {
    gap: SPACING.md,
  },
  cardItem: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
    gap: SPACING.md,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  cardImage: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.borderLight,
  },
  cardEmojiWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.borderLight,
  },
  cardEmoji: {
    fontSize: 18,
  },
  cardTitle: {
    fontSize: FONTS.sizes.base,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusPillText: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONTS.medium,
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  cardProgress: {
    flex: 1,
    minWidth: 0,
    marginTop: 0,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tableHeaderText: {
    fontSize: FONTS.sizes.sm,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
    textAlign: 'left',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    alignItems: 'center',
  },
  tableCell: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text,
    fontFamily: FONTS.regular,
  },
  nameHeader: {
    textAlign: 'left',
    marginRight: SPACING.md,
  },
  statusHeader: {
    textAlign: 'left',
  },
  imageHeader: {
    width: 56,
    flexShrink: 0,
    marginRight: SPACING.md,
  },
  priceHeader: {
    textAlign: 'right',
    flexShrink: 0,
    marginRight: SPACING.md,
  },
  imageColWidth: {
    width: 56,
    flexShrink: 0,
    marginRight: SPACING.md,
  },
  priceColWidth: {
    width: 104,
    flexShrink: 0,
    marginRight: SPACING.md,
  },
  stockColWidth: {
    width: 180,
    flexShrink: 0,
    marginRight: SPACING.md,
  },
  statusColWidth: {
    width: 90,
    flexShrink: 0,
  },
  priceCell: {
    textAlign: 'right',
    minWidth: 90,
    paddingRight: 6,
  },
  stockHeader: {
    textAlign: 'left',
  },
  imageCellContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameCell: {
    flexShrink: 1,
    minWidth: 80,
    marginRight: SPACING.md,
  },
  productEmoji: {
    fontSize: 20,
  },
  productImage: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: COLORS.borderLight,
  },
  stockCellContainer: {
    justifyContent: 'center',
    minWidth: 140,
    paddingLeft: 6,
  },
  stockBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    alignSelf: 'flex-start',
  },
  stockText: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONTS.medium,
  },
  progressContainer: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressTrack: {
    flex: 1,
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  progressRemainder: {
    height: '100%',
    backgroundColor: COLORS.borderLight,
  },
  progressLabel: {
    width: 40,
    textAlign: 'right',
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
  },
  statusCell: {
    textAlign: 'left',
    minWidth: 70,
  },
  actionsHeader: {
    textAlign: 'right',
  },
  actionsColWidth: {
    width: 64,
    flexShrink: 0,
  },
  cardActions: {
    marginTop: SPACING.md,
    alignItems: 'flex-end',
  },
})
;
