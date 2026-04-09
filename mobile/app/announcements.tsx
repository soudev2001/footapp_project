import React, { useEffect, useState, useCallback } from 'react';
import { Alert,
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
  RefreshControl, TouchableOpacity,
} from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius } from '../constants/theme';
import { getAnnouncements, Announcement } from '../services/announcements';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function AnnouncementsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await getAnnouncements();
      setAnnouncements(Array.isArray(data) ? data : []);
    } catch (e: any) { Alert.alert('Erreur', e?.message || 'Une erreur est survenue'); } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function onRefresh() {
    setRefreshing(true);
    load();
  }

  function formatDate(dateStr: string) {
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR', {
        day: 'numeric', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch { return dateStr; }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: Spacing.md }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Annonces du club</Text>
      </View>

      {announcements.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="megaphone-outline" size={64} color={Colors.textLight} />
          <Text style={styles.emptyText}>Aucune annonce pour le moment</Text>
        </View>
      ) : (
        announcements.map(ann => {
          const isOpen = expanded === ann._id;
          const senderName = ann.sender
            ? `${ann.sender.first_name} ${ann.sender.last_name}`
            : 'Club';
          return (
            <TouchableOpacity
              key={ann._id}
              style={styles.card}
              onPress={() => setExpanded(isOpen ? null : ann._id)}
              activeOpacity={0.85}
            >
              <View style={styles.cardHeader}>
                <View style={styles.iconWrap}>
                  <Ionicons name="megaphone" size={20} color={Colors.white} />
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.subject} numberOfLines={isOpen ? undefined : 1}>
                    {ann.subject}
                  </Text>
                  <Text style={styles.meta}>
                    {senderName} · {formatDate(ann.created_at)}
                  </Text>
                </View>
                <Ionicons
                  name={isOpen ? 'chevron-up' : 'chevron-down'}
                  size={18} color={Colors.textSecondary}
                />
              </View>

              {isOpen && (
                <View style={styles.body}>
                  <Text style={styles.bodyText}>{ann.body}</Text>
                  <View style={styles.tagsRow}>
                    {ann.target_label ? (
                      <View style={styles.tag}>
                        <Ionicons name="people" size={12} color={Colors.accent} />
                        <Text style={styles.tagText}>{ann.target_label}</Text>
                      </View>
                    ) : null}
                    {ann.recipients_count > 0 && (
                      <View style={styles.tag}>
                        <Ionicons name="person" size={12} color={Colors.primary} />
                        <Text style={styles.tagText}>{ann.recipients_count} destinataire{ann.recipients_count > 1 ? 's' : ''}</Text>
                      </View>
                    )}
                  </View>
                </View>
              )}
            </TouchableOpacity>
          );
        })
      )}
      <View style={{ height: Spacing.xl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.primary, borderRadius: BorderRadius.lg,
    padding: Spacing.md, marginBottom: Spacing.md,
  },
  backBtn: { padding: Spacing.xs },
  headerTitle: { fontSize: FontSizes.xl, fontWeight: 'bold', color: Colors.white, flex: 1 },
  emptyContainer: { alignItems: 'center', paddingVertical: Spacing.xxl, gap: Spacing.md },
  emptyText: { color: Colors.textSecondary, fontSize: FontSizes.md },
  card: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm, overflow: 'hidden', elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: Spacing.sm,
  },
  iconWrap: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center',
  },
  cardInfo: { flex: 1 },
  subject: { fontSize: FontSizes.md, fontWeight: '600', color: Colors.text },
  meta: { fontSize: FontSizes.xs, color: Colors.textSecondary, marginTop: 2 },
  body: {
    paddingHorizontal: Spacing.md, paddingBottom: Spacing.md,
    borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing.sm,
  },
  bodyText: { fontSize: FontSizes.md, color: Colors.text, lineHeight: 22 },
  tagsRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm, flexWrap: 'wrap' },
  tag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.background, borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs,
  },
  tagText: { fontSize: FontSizes.xs, color: Colors.textSecondary },
});
