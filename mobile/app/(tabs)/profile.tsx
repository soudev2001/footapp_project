import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'expo-router';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import { getPlayerProfile, getPlayerStats } from '../../services/player';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [player, setPlayer] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [p, s] = await Promise.all([
        getPlayerProfile().catch(() => null),
        getPlayerStats().catch(() => null),
      ]);
      setPlayer(p);
      setStats(s);
    } catch (e: any) { Alert.alert('Erreur', e?.message || 'Une erreur est survenue'); } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    Alert.alert('Déconnexion', 'Voulez-vous vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnexion', style: 'destructive', onPress: () => logout() },
    ]);
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const profile = user?.profile;
  const displayName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || user?.email;

  return (
    <ScrollView style={styles.container}>
      {/* Profile header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarLarge}>
          <Text style={styles.avatarText}>
            {(profile?.first_name || user?.email || '?')[0].toUpperCase()}
          </Text>
        </View>
        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{user?.role?.toUpperCase()}</Text>
        </View>
      </View>

      {/* Player info */}
      {player && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations joueur</Text>
          <View style={styles.infoRow}>
            <InfoItem icon="shirt" label="Numéro" value={player.jersey_number?.toString() || '-'} />
            <InfoItem icon="locate" label="Poste" value={player.position || '-'} />
            <InfoItem icon="pulse" label="Statut" value={player.status || 'active'} />
          </View>
        </View>
      )}

      {/* Stats */}
      {stats?.stats && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statistiques</Text>
          <View style={styles.statsGrid}>
            <StatCard label="Buts" value={stats.stats.goals || 0} color={Colors.success} />
            <StatCard label="Passes D." value={stats.stats.assists || 0} color={Colors.accent} />
            <StatCard label="Matchs" value={stats.stats.matches_played || 0} color={Colors.primary} />
            <StatCard label="Cartons J." value={stats.stats.yellow_cards || 0} color={Colors.warning} />
          </View>
        </View>
      )}

      {/* Technical ratings */}
      {stats?.technical_ratings && Object.keys(stats.technical_ratings).length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes techniques</Text>
          {Object.entries(stats.technical_ratings).map(([key, val]: [string, any]) => (
            <View key={key} style={styles.ratingRow}>
              <Text style={styles.ratingLabel}>{key.toUpperCase()}</Text>
              <View style={styles.ratingBar}>
                <View style={[styles.ratingFill, { width: `${Math.min(val, 100)}%` }]} />
              </View>
              <Text style={styles.ratingValue}>{val}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Quick actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>
        <MenuItem icon="create" label="Modifier le profil" onPress={() => router.push('/player/edit-profile')} />
        {user?.role === 'player' && (
          <>
            <MenuItem icon="trending-up" label="Hub Évolution" onPress={() => router.push('/player/evo-hub')} />
            <MenuItem icon="document-text" label="Mes contrats" onPress={() => router.push('/player/contracts')} />
            <MenuItem icon="folder" label="Documents" onPress={() => router.push('/player/documents')} />
            <MenuItem icon="people" label="Mon équipe" onPress={() => router.push('/player/team')} />
          </>
        )}
        {(user?.role === 'coach' || user?.role === 'admin') && (
          <MenuItem icon="clipboard" label="Espace Coach" onPress={() => router.push('/coach/')} />
        )}
        {user?.role === 'admin' && (
          <MenuItem icon="settings" label="Panel Admin" onPress={() => router.push('/admin/')} />
        )}
        {user?.role === 'parent' && (
          <MenuItem icon="people" label="Espace Parent" onPress={() => router.push('/parent/')} />
        )}
        {user?.role === 'superadmin' && (
          <MenuItem icon="shield-checkmark" label="Super Admin" onPress={() => router.push('/superadmin/')} />
        )}
        {(user?.role === 'admin' || user?.role === 'coach') && (
          <MenuItem icon="globe" label="ISY Hub" onPress={() => router.push('/isy/')} />
        )}
        <MenuItem icon="business" label="Mon Club" onPress={() => router.push('/club/')} />
        <MenuItem icon="megaphone" label="Annonces" onPress={() => router.push('/announcements')} />
        <MenuItem icon="settings-outline" label="Paramètres" onPress={() => router.push('/player/settings')} />
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={22} color={Colors.error} />
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </TouchableOpacity>

      <View style={{ height: Spacing.xl }} />
    </ScrollView>
  );
}

function InfoItem({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={infoStyles.item}>
      <Ionicons name={icon as any} size={20} color={Colors.primary} />
      <Text style={infoStyles.label}>{label}</Text>
      <Text style={infoStyles.value}>{value}</Text>
    </View>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={statStyles.card}>
      <Text style={[statStyles.value, { color }]}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

function MenuItem({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={menuStyles.item} onPress={onPress}>
      <Ionicons name={icon as any} size={22} color={Colors.primary} />
      <Text style={menuStyles.label}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={Colors.textLight} />
    </TouchableOpacity>
  );
}

const infoStyles = StyleSheet.create({
  item: { flex: 1, alignItems: 'center', padding: Spacing.sm },
  label: { fontSize: FontSizes.xs, color: Colors.textSecondary, marginTop: 4 },
  value: { fontSize: FontSizes.lg, fontWeight: 'bold', color: Colors.text },
});

const statStyles = StyleSheet.create({
  card: {
    width: '48%',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  value: { fontSize: FontSizes.xxl, fontWeight: 'bold' },
  label: { fontSize: FontSizes.sm, color: Colors.textSecondary },
});

const menuStyles = StyleSheet.create({
  item: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.white, borderRadius: BorderRadius.md,
    padding: Spacing.md, marginBottom: Spacing.xs,
  },
  label: { flex: 1, fontSize: FontSizes.md, fontWeight: '500', color: Colors.text },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  profileHeader: {
    backgroundColor: Colors.primary,
    alignItems: 'center',
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  avatarLarge: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.white,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatarText: { fontSize: FontSizes.hero, fontWeight: 'bold', color: Colors.primary },
  name: { fontSize: FontSizes.xxl, fontWeight: 'bold', color: Colors.white },
  email: { fontSize: FontSizes.md, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  roleBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.sm,
  },
  roleText: { color: Colors.white, fontWeight: '600', fontSize: FontSizes.sm },
  section: { padding: Spacing.md },
  sectionTitle: { fontSize: FontSizes.xl, fontWeight: 'bold', color: Colors.text, marginBottom: Spacing.md },
  infoRow: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  ratingLabel: { width: 40, fontSize: FontSizes.sm, fontWeight: '600', color: Colors.text },
  ratingBar: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    marginHorizontal: Spacing.sm,
    overflow: 'hidden',
  },
  ratingFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 4 },
  ratingValue: { width: 30, textAlign: 'right', fontSize: FontSizes.sm, fontWeight: 'bold', color: Colors.text },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    margin: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.error + '30',
  },
  logoutText: { color: Colors.error, fontSize: FontSizes.lg, fontWeight: '600' },
});
