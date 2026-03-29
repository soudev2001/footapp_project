import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator,
  TextInput, RefreshControl, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import { getMembers, deleteMember } from '../../services/admin';
import { Ionicons } from '@expo/vector-icons';

export default function MembersScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const data = await getMembers();
      setMembers(data || []);
    } catch {} finally { setLoading(false); }
  }

  async function onRefresh() { setRefreshing(true); await load(); setRefreshing(false); }

  async function handleDelete(id: string, name: string) {
    Alert.alert('Supprimer', `Supprimer ${name} ?`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        try { await deleteMember(id); load(); } catch { Alert.alert('Erreur'); }
      }},
    ]);
  }

  const filtered = members.filter(m => {
    const q = search.toLowerCase();
    return !q || (m.first_name + ' ' + m.last_name + ' ' + (m.email || '') + ' ' + (m.role || '')).toLowerCase().includes(q);
  });

  const roleColor = (r: string) => r === 'admin' ? Colors.error : r === 'coach' ? Colors.accent : r === 'player' ? Colors.primary : Colors.textSecondary;

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <Ionicons name="search" size={20} color={Colors.textSecondary} />
        <TextInput style={styles.searchInput} value={search} onChangeText={setSearch}
          placeholder="Rechercher un membre..." />
      </View>

      <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/admin/add-member')}>
        <Ionicons name="person-add" size={20} color={Colors.white} />
        <Text style={styles.addBtnText}>Ajouter un membre</Text>
      </TouchableOpacity>

      <FlatList
        data={filtered}
        keyExtractor={item => item._id || Math.random().toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
        ListEmptyComponent={<Text style={styles.empty}>Aucun membre trouvé</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{(item.first_name?.[0] || '').toUpperCase()}{(item.last_name?.[0] || '').toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.first_name} {item.last_name}</Text>
                <Text style={styles.email}>{item.email}</Text>
                <View style={[styles.roleBadge, { backgroundColor: roleColor(item.role) + '20' }]}>
                  <Text style={[styles.roleText, { color: roleColor(item.role) }]}>{item.role}</Text>
                </View>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity onPress={() => router.push({ pathname: '/admin/edit-member', params: { id: item._id } })}>
                  <Ionicons name="create" size={22} color={Colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item._id, item.first_name)}>
                  <Ionicons name="trash" size={22} color={Colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: Spacing.md },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  searchInput: { flex: 1, padding: Spacing.sm, fontSize: FontSizes.md },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: Colors.primary, borderRadius: BorderRadius.md, padding: Spacing.sm, marginBottom: Spacing.md },
  addBtnText: { color: Colors.white, fontWeight: '600' },
  empty: { color: Colors.textSecondary, fontStyle: 'italic', textAlign: 'center', padding: Spacing.lg },
  card: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.sm },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary + '20', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontWeight: 'bold', color: Colors.primary, fontSize: FontSizes.md },
  name: { fontSize: FontSizes.md, fontWeight: '600', color: Colors.text },
  email: { fontSize: FontSizes.sm, color: Colors.textSecondary },
  roleBadge: { alignSelf: 'flex-start', paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.sm, marginTop: 2 },
  roleText: { fontSize: FontSizes.xs, fontWeight: '600', textTransform: 'uppercase' },
  actions: { flexDirection: 'row', gap: Spacing.md },
});
