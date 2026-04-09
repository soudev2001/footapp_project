import React, { useEffect, useState } from 'react';
import { Alert,
  View, Text, FlatList, StyleSheet, RefreshControl,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../../services/notifications';
import { Ionicons } from '@expo/vector-icons';

export default function NotificationsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const data = await getNotifications();
      setNotifications(data || []);
    } catch (e: any) { Alert.alert('Erreur', e?.message || 'Une erreur est survenue'); } finally {
      setLoading(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  async function handleMarkRead(id: string) {
    try {
      await markNotificationRead(id);
      setNotifications(prev => prev.map(n =>
        n._id === id ? { ...n, read: true } : n
      ));
    } catch (e: any) { Alert.alert('Erreur', e?.message || 'Une erreur est survenue'); }
  }

  async function handleMarkAllRead() {
    try {
      await markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (e: any) { Alert.alert('Erreur', e?.message || 'Une erreur est survenue'); }
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  function getIcon(type: string) {
    switch (type) {
      case 'convocation': return 'football';
      case 'match': return 'trophy';
      case 'training': return 'fitness';
      case 'message': return 'chatbubble';
      default: return 'information-circle';
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
    <View style={styles.container}>
      {/* Header */}
      {unreadCount > 0 && (
        <View style={styles.header}>
          <Text style={styles.headerText}>{unreadCount} non lu{unreadCount > 1 ? 's' : ''}</Text>
          <TouchableOpacity onPress={handleMarkAllRead}>
            <Text style={styles.markAllText}>Tout marquer lu</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={notifications}
        keyExtractor={(item, i) => item._id || String(i)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
        contentContainerStyle={notifications.length === 0 ? styles.emptyList : undefined}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={64} color={Colors.textLight} />
            <Text style={styles.emptyText}>Aucune notification</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.notifItem, !item.read && styles.notifUnread]}
            onPress={() => !item.read && handleMarkRead(item._id)}
          >
            <View style={[styles.iconCircle, {
              backgroundColor: item.type === 'convocation' ? Colors.secondary + '20' :
                item.type === 'match' ? Colors.primary + '20' : Colors.accent + '20'
            }]}>
              <Ionicons
                name={getIcon(item.type)}
                size={22}
                color={item.type === 'convocation' ? Colors.secondary : Colors.primary}
              />
            </View>
            <View style={styles.notifContent}>
              <Text style={[styles.notifTitle, !item.read && { fontWeight: 'bold' }]}>
                {item.title || 'Notification'}
              </Text>
              <Text style={styles.notifMessage} numberOfLines={2}>
                {item.message || ''}
              </Text>
              <Text style={styles.notifTime}>
                {item.created_at ? new Date(item.created_at).toLocaleDateString('fr-FR', {
                  day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                }) : ''}
              </Text>
            </View>
            {!item.read && <View style={styles.unreadDot} />}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerText: { fontSize: FontSizes.md, color: Colors.text, fontWeight: '600' },
  markAllText: { fontSize: FontSizes.md, color: Colors.primary, fontWeight: '600' },
  emptyList: { flex: 1 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: Colors.textSecondary, fontSize: FontSizes.lg, marginTop: Spacing.md },
  notifItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  notifUnread: {
    backgroundColor: Colors.primary + '08',
  },
  iconCircle: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
  },
  notifContent: { flex: 1, marginLeft: Spacing.md },
  notifTitle: { fontSize: FontSizes.md, color: Colors.text },
  notifMessage: { fontSize: FontSizes.sm, color: Colors.textSecondary, marginTop: 2 },
  notifTime: { fontSize: FontSizes.xs, color: Colors.textLight, marginTop: 4 },
  unreadDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: Colors.primary,
  },
});
