import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import { getTactics } from '../../services/coach';
import { Ionicons } from '@expo/vector-icons';

const TACTIC_ICONS: Record<string, string> = {
  offensive: 'flash',
  defensive: 'shield',
  balanced: 'swap-horizontal',
  counter: 'arrow-forward',
  possession: 'sync',
};

export default function TacticsScreen() {
  const [loading, setLoading] = useState(true);
  const [tactics, setTactics] = useState<any[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const data = await getTactics();
      setTactics(data || []);
    } catch {} finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      data={tactics}
      keyExtractor={(item, i) => item._id || item.name || String(i)}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <Text style={styles.title}>Préréglages tactiques</Text>
      }
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Ionicons name="clipboard-outline" size={64} color={Colors.textLight} />
          <Text style={styles.emptyText}>Aucun préréglage</Text>
          <Text style={styles.emptySubtext}>Les tactiques apparaîtront ici</Text>
        </View>
      }
      renderItem={({ item }) => {
        const isSelected = selected === (item._id || item.name);
        const iconName = TACTIC_ICONS[item.style || item.type || ''] || 'options';

        return (
          <TouchableOpacity
            style={[styles.card, isSelected && styles.cardSelected]}
            onPress={() => setSelected(isSelected ? null : (item._id || item.name))}
          >
            <View style={[styles.iconCircle, isSelected && { backgroundColor: Colors.primary }]}>
              <Ionicons
                name={iconName as any}
                size={24}
                color={isSelected ? Colors.white : Colors.primary}
              />
            </View>
            <View style={styles.cardContent}>
              <Text style={[styles.cardTitle, isSelected && { color: Colors.primary }]}>
                {item.name || 'Tactique'}
              </Text>
              <Text style={styles.cardFormation}>{item.formation || '4-3-3'}</Text>
              {item.description && (
                <Text style={styles.cardDesc} numberOfLines={isSelected ? undefined : 2}>
                  {item.description}
                </Text>
              )}
              {isSelected && item.instructions && (
                <View style={styles.instructions}>
                  <Text style={styles.instructionsTitle}>Instructions:</Text>
                  {(Array.isArray(item.instructions) ? item.instructions : [item.instructions]).map(
                    (instr: string, i: number) => (
                      <Text key={i} style={styles.instructionItem}>• {instr}</Text>
                    )
                  )}
                </View>
              )}
            </View>
            <Ionicons
              name={isSelected ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: Spacing.md },
  title: { fontSize: FontSizes.title, fontWeight: 'bold', color: Colors.text, marginBottom: Spacing.md },
  emptyContainer: { alignItems: 'center', paddingTop: Spacing.xxl * 2 },
  emptyText: { color: Colors.textSecondary, fontSize: FontSizes.lg, marginTop: Spacing.md },
  emptySubtext: { color: Colors.textLight, fontSize: FontSizes.sm, marginTop: 4 },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    elevation: 1,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, shadowOffset: { width: 0, height: 1 },
    borderWidth: 2, borderColor: 'transparent',
  },
  cardSelected: { borderColor: Colors.primary + '40', backgroundColor: Colors.primary + '05' },
  iconCircle: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center', alignItems: 'center',
  },
  cardContent: { flex: 1, marginLeft: Spacing.md },
  cardTitle: { fontSize: FontSizes.lg, fontWeight: 'bold', color: Colors.text },
  cardFormation: { fontSize: FontSizes.sm, color: Colors.secondary, fontWeight: '600' },
  cardDesc: { fontSize: FontSizes.sm, color: Colors.textSecondary, marginTop: 4 },
  instructions: { marginTop: Spacing.sm, padding: Spacing.sm, backgroundColor: Colors.background, borderRadius: BorderRadius.md },
  instructionsTitle: { fontSize: FontSizes.sm, fontWeight: 'bold', color: Colors.text, marginBottom: 4 },
  instructionItem: { fontSize: FontSizes.sm, color: Colors.textSecondary, marginLeft: Spacing.xs },
});
