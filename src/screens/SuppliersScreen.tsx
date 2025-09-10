import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, ActivityIndicator, Alert, Platform, useWindowDimensions, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../utils/constants';
import { Supplier } from '../types';
import { SupplierService } from '../services/supplierService';
import { useAuth } from '../contexts/AuthContext';
import { SuppliersScreenNavigationProp } from '../types';
import { Logo } from '../components/Logo';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Props { navigation: SuppliersScreenNavigationProp }

export const SuppliersScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const isSmall = width < 600;
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const rows = await SupplierService.getAllSuppliers(user.id);
      setSuppliers(rows);
    } catch (e) {
      Alert.alert('Erreur', "Impossible de charger les fournisseurs");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [user?.id]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return suppliers;
    return suppliers.filter(s =>
      (s.name || '').toLowerCase().includes(q) ||
      (s.contactPerson || '').toLowerCase().includes(q) ||
      (s.email || '').toLowerCase().includes(q) ||
      (s.phone || '').toLowerCase().includes(q) ||
      (s.tags || []).some(t => t.toLowerCase().includes(q))
    );
  }, [search, suppliers]);

  const formatAddress = (s: Supplier) => {
    const parts = [
      s.addressLine1,
      s.addressLine2,
      s.postalCode && s.city ? `${s.postalCode} ${s.city}` : (s.city || ''),
      s.country,
    ].filter(Boolean) as string[];
    return parts.join(', ');
  };

  const onDelete = async (id: string) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const ok = window.confirm('Supprimer ce fournisseur ?');
      if (ok) {
        try {
          await SupplierService.deleteSupplier(id);
          setSuppliers(prev => prev.filter(s => s.id !== id));
        } catch (e) {
          alert('Suppression impossible');
        }
      }
      return;
    }
    Alert.alert('Supprimer', 'Supprimer ce fournisseur ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        try {
          await SupplierService.deleteSupplier(id);
          setSuppliers(prev => prev.filter(s => s.id !== id));
        } catch (e) {
          Alert.alert('Erreur', 'Suppression impossible');
        }
      }}
    ]);
  };

  const renderHeaderRow = () => (
    <View style={styles.tableHeader}>
      <Text style={[styles.th, { flex: 2 }]}>Nom</Text>
      <Text style={[styles.th, { flex: 2 }]}>Contact</Text>
      <Text style={[styles.th, { flex: 2 }]}>Email</Text>
      <Text style={[styles.th, { flex: 1 }]}>Tags</Text>
      <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>Statut</Text>
    </View>
  );

  const renderItem = ({ item }: { item: Supplier }) => {
    const nameParts = (item.contactPerson || '').split(' ').filter(Boolean);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ');
    const tag = item.tags?.[0];

    if (isSmall) {
      return (
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('AddEditSupplier', { supplierId: item.id })}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
          </View>
          <View style={styles.cardRow}>
            <Text style={styles.labelLink}>Adresse</Text>
            <Text style={styles.cardValueText} numberOfLines={1}>{formatAddress(item) || '—'}</Text>
          </View>
          <View style={styles.cardRow}>
            <Text style={styles.labelLink}>Téléphone</Text>
            <Text style={styles.cardValueText} numberOfLines={1}>{item.phone || '—'}</Text>
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('AddEditSupplier', { supplierId: item.id })}>
        <View style={[styles.cell, { flex: 2 }]}> 
          <Text style={styles.nameLink} numberOfLines={1}>{item.name}</Text>
        </View>
        <View style={[styles.cell, { flex: 2 }]}> 
          {!!(firstName || lastName) && (
            <Text style={styles.contactName} numberOfLines={1}>
              {firstName}{lastName ? ` ${lastName}` : ''}
            </Text>
          )}
          <Text style={item.phone ? styles.phoneText : styles.cellMuted} numberOfLines={1}>
            {item.phone || '—'}
          </Text>
        </View>
        <View style={[styles.cell, { flex: 2 }]}> 
          <Text numberOfLines={1} style={styles.emailLink}>{item.email || '—'}</Text>
        </View>
        <View style={[styles.cell, { flex: 1 }]}> 
          {tag ? (
            <View style={styles.tagBadge}><Text style={styles.tagText}>{tag}</Text></View>
          ) : (
            <Text style={styles.cellMuted}>—</Text>
          )}
        </View>
        <View style={[styles.rightActions, styles.cell, { flex: 1 }]}> 
          <Ionicons name="checkmark-done-outline" size={18} color={COLORS.success} style={{ marginRight: 8 }} />
          <TouchableOpacity onPress={() => navigation.navigate('AddEditSupplier', { supplierId: item.id })} style={styles.iconBtn}>
            <Ionicons name="create-outline" size={18} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onDelete(item.id)} style={styles.iconBtn}>
            <Ionicons name="trash-outline" size={18} color={COLORS.error} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const total = suppliers.length;
  const active = total; // Pas de champ "status" dans le modèle → on affiche le total comme actif pour l'instant
  const deliveriesThisWeek = 0; // Nécessite un service de livraisons/achats fournisseurs

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {isSmall ? (
        <>
          <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} translucent={false} />
          <View style={[styles.mobileHeaderWrap]}>
            <View style={[styles.mobileHeader, { paddingTop: SPACING.md }]}>
              <Text style={styles.mobileTitle}>Fournisseurs</Text>
              <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('AddEditSupplier', {})}>
                <Text style={styles.primaryBtnText}>Nouveau fournisseur</Text>
              </TouchableOpacity>
              <View style={styles.mobileSearchBox}>
                <Ionicons name="search" size={18} color={COLORS.textLight} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Recherche de fournisseurs"
                  placeholderTextColor={COLORS.textLight}
                  value={search}
                  onChangeText={setSearch}
                />
              </View>
            </View>
          </View>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              contentContainerStyle={{ paddingHorizontal: SPACING.md, paddingBottom: SPACING.lg }}
              refreshing={refreshing}
              onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }}
              ListEmptyComponent={() => (
                <View style={[styles.center, { paddingVertical: 40 }]}> 
                  <Text style={styles.muted}>Aucun fournisseur</Text>
                </View>
              )}
            />
          )}
        </>
      ) : (
        <>
          <LinearGradient
            colors={[COLORS.gradientStart, COLORS.gradientEnd]}
            style={styles.header}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.headerContent}>
              <Logo size="small" showText={false} />
              <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddEditSupplier', {})}>
                <Ionicons name="add" size={22} color={COLORS.white} />
                <Text style={styles.addText}>Ajouter</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.subtitle}>Gérez vos partenaires commerciaux en toute simplicité</Text>
          </LinearGradient>

          <View style={[styles.metricsRow, { gap: 8 as any }]}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Total fournisseurs</Text>
              <Text style={styles.metricValue}>{total}</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Fournisseurs actifs</Text>
              <Text style={styles.metricValue}>{active}</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Livraisons cette semaine</Text>
              <Text style={styles.metricValue}>{deliveriesThisWeek}</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Statut</Text>
              <Text style={styles.metricKPI}>Actif</Text>
            </View>
          </View>

          <View style={styles.filtersRow}>
            <View style={styles.searchBox}>
              <Ionicons name="search" size={18} color={COLORS.textLight} />
              <TextInput
                style={styles.searchInput}
                placeholder="Rechercher (nom, contact, email, tag)"
                placeholderTextColor={COLORS.textLight}
                value={search}
                onChangeText={setSearch}
              />
            </View>
            <TouchableOpacity style={styles.filterChip}>
              <Text style={styles.filterChipText}>Tous les statuts</Text>
              <Ionicons name="chevron-down" size={16} color={COLORS.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterChip}>
              <Text style={styles.filterChipText}>Ajouté ce mois-ci</Text>
              <Ionicons name="chevron-down" size={16} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          {renderHeaderRow()}

          {loading ? (
            <View style={styles.center}> 
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              contentContainerStyle={{ paddingHorizontal: SPACING.md, paddingBottom: SPACING.lg }}
              refreshing={refreshing}
              onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }}
              ListEmptyComponent={() => (
                <View style={[styles.center, { paddingVertical: 40 }]}> 
                  <Text style={styles.muted}>Aucun fournisseur</Text>
                </View>
              )}
            />
          )}
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingTop: SPACING.large, paddingBottom: SPACING.small, paddingHorizontal: SPACING.medium },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  subtitle: { marginTop: 4, color: COLORS.white, opacity: 0.9, fontFamily: FONTS.regular },
  addBtn: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: BORDER_RADIUS.sm, paddingHorizontal: SPACING.md, paddingVertical: 8, alignItems: 'center' },
  addText: { color: COLORS.white, fontFamily: FONTS.medium, marginLeft: 6 },

  metricsRow: { flexDirection: 'row', gap: 8 as any, paddingHorizontal: SPACING.md, paddingTop: SPACING.sm },
  metricCard: { flex: 1, backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.sm, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  metricLabel: { fontFamily: FONTS.regular, color: COLORS.textSecondary, marginBottom: 4 },
  metricValue: { fontFamily: FONTS.bold, color: COLORS.text, fontSize: 18 },
  metricKPI: { fontFamily: FONTS.bold, color: COLORS.text, fontSize: 18 },

  filtersRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, gap: 8 as any },
  filterLabel: { marginTop: 6, marginBottom: 2, color: COLORS.textSecondary, fontFamily: FONTS.medium },
  searchBox: { flex: 1, backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.sm, paddingHorizontal: SPACING.md, paddingVertical: 8, borderWidth: 1, borderColor: COLORS.border, flexDirection: 'row', alignItems: 'center', gap: 8 as any, minHeight: 40 },
  searchInput: { flex: 1, marginLeft: 8, color: COLORS.text, fontFamily: FONTS.regular },
  filterChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.sm, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: SPACING.md, height: 40 },
  filterChipText: { marginRight: 6, color: COLORS.text, fontFamily: FONTS.regular },

  tableHeader: { flexDirection: 'row', paddingHorizontal: SPACING.md, paddingVertical: 10, borderTopWidth: 1, borderBottomWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface },
  th: { fontFamily: FONTS.medium, color: COLORS.textSecondary },

  center: { justifyContent: 'center', alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.md, paddingVertical: 10, paddingHorizontal: SPACING.md, borderWidth: 1, borderColor: COLORS.border, marginHorizontal: SPACING.md, marginTop: SPACING.sm, minHeight: 56 },
  cell: { justifyContent: 'center' },
  nameLink: { fontFamily: FONTS.medium, fontSize: 15, color: COLORS.primary },
  contactName: { fontFamily: FONTS.regular, color: COLORS.text },
  cellMuted: { fontFamily: FONTS.regular, color: COLORS.textLight },
  phoneText: { fontFamily: FONTS.medium, color: COLORS.text },
  emailLink: { fontFamily: FONTS.medium, color: COLORS.primary },
  tagBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(30,58,138,0.1)', borderRadius: 999, paddingVertical: 4, paddingHorizontal: 10, borderWidth: 0, },
  tagText: { color: COLORS.primary, fontFamily: FONTS.medium },
  rightActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
  iconBtn: { padding: 6, marginLeft: 4, ...Platform.select({ web: { cursor: 'pointer' as any } }) },

  // Mobile header
  mobileHeaderWrap: { marginTop: (SPACING.xl || 24), paddingTop: (SPACING.lg || (SPACING.md * 1.5)), marginHorizontal: SPACING.md, backgroundColor: COLORS.surface, borderTopLeftRadius: ((BORDER_RADIUS as any).xl || (BORDER_RADIUS as any).lg || BORDER_RADIUS.md), borderTopRightRadius: ((BORDER_RADIUS as any).xl || (BORDER_RADIUS as any).lg || BORDER_RADIUS.md), overflow: 'hidden' },
  mobileHeader: { paddingHorizontal: SPACING.md, paddingBottom: SPACING.sm },
  mobileTitle: { fontFamily: FONTS.bold, fontSize: 30, color: COLORS.text, marginBottom: SPACING.sm },
  primaryBtn: { backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.md, alignItems: 'center', paddingVertical: 12, marginBottom: SPACING.sm },
  primaryBtnText: { color: COLORS.white, fontFamily: FONTS.medium, fontSize: 16 },
  mobileSearchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surfaceAlt || '#F2F4F7', borderRadius: BORDER_RADIUS.md, paddingHorizontal: SPACING.md, height: 44 },

  // Mobile card styles
  card: { backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, marginHorizontal: SPACING.md, marginTop: SPACING.sm },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  cardTitle: { fontFamily: FONTS.semiBold, fontSize: 16, color: COLORS.text, flex: 1, marginRight: 8 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 8 as any, marginTop: 4 },
  labelLink: { color: COLORS.primary, fontFamily: FONTS.medium },
  cardValueText: { color: COLORS.text, fontFamily: FONTS.regular, flex: 1 },
  cardActions: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
 });
