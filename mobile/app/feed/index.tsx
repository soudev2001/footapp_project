import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator,
  TextInput, RefreshControl, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import { getPosts, likePost } from '../../services/posts';
import { Ionicons } from '@expo/vector-icons';

export default function FeedScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    try { const d = await getPosts(); setPosts(d || []); }
    catch {} finally { setLoading(false); }
  }
  async function onRefresh() { setRefreshing(true); await load(); setRefreshing(false); }

  async function handleLike(postId: string) {
    try {
      await likePost(postId);
      setPosts(prev => prev.map(p =>
        p._id === postId ? { ...p, liked: !p.liked, likes_count: (p.likes_count || 0) + (p.liked ? -1 : 1) } : p
      ));
    } catch {}
  }

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  const filtered = posts.filter(p => !search || (p.title + ' ' + p.content).toLowerCase().includes(search.toLowerCase()));

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <Ionicons name="search" size={20} color={Colors.textSecondary} />
        <TextInput style={styles.searchInput} value={search} onChangeText={setSearch} placeholder="Rechercher..." />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item._id || Math.random().toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
        contentContainerStyle={{ paddingBottom: Spacing.xl }}
        ListEmptyComponent={<Text style={styles.empty}>Aucune publication</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.postCard} onPress={() => router.push({ pathname: '/feed/post-detail', params: { id: item._id } })}>
            <View style={styles.postHeader}>
              <View style={styles.authorAvatar}>
                <Text style={styles.authorInitial}>{(item.author_name?.[0] || '?').toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.authorName}>{item.author_name || 'Anonyme'}</Text>
                <Text style={styles.postDate}>{item.created_at ? new Date(item.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}</Text>
              </View>
              {item.type && (
                <View style={[styles.typeBadge, { backgroundColor: item.type === 'announcement' ? Colors.secondary + '20' : Colors.accent + '20' }]}>
                  <Text style={styles.typeBadgeText}>{item.type === 'announcement' ? 'Annonce' : item.type}</Text>
                </View>
              )}
            </View>

            {item.title && <Text style={styles.postTitle}>{item.title}</Text>}
            <Text style={styles.postContent} numberOfLines={3}>{item.content}</Text>

            {item.image_url && (
              <Image source={{ uri: item.image_url }} style={styles.postImage} resizeMode="cover" />
            )}

            <View style={styles.postFooter}>
              <TouchableOpacity style={styles.footerBtn} onPress={() => handleLike(item._id)}>
                <Ionicons name={item.liked ? 'heart' : 'heart-outline'} size={20} color={item.liked ? Colors.error : Colors.textSecondary} />
                <Text style={styles.footerText}>{item.likes_count || 0}</Text>
              </TouchableOpacity>
              <View style={styles.footerBtn}>
                <Ionicons name="chatbubble-outline" size={18} color={Colors.textSecondary} />
                <Text style={styles.footerText}>{item.comments_count || 0}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, paddingHorizontal: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  searchInput: { flex: 1, padding: Spacing.sm, fontSize: FontSizes.md },
  empty: { color: Colors.textSecondary, fontStyle: 'italic', textAlign: 'center', padding: Spacing.xl },
  postCard: { backgroundColor: Colors.white, marginHorizontal: Spacing.md, marginTop: Spacing.md, borderRadius: BorderRadius.lg, padding: Spacing.md },
  postHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  authorAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primary + '20', justifyContent: 'center', alignItems: 'center' },
  authorInitial: { fontWeight: 'bold', color: Colors.primary },
  authorName: { fontWeight: '600', color: Colors.text, fontSize: FontSizes.md },
  postDate: { fontSize: FontSizes.xs, color: Colors.textSecondary },
  typeBadge: { borderRadius: BorderRadius.sm, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  typeBadgeText: { fontSize: FontSizes.xs, fontWeight: '600' },
  postTitle: { fontSize: FontSizes.lg, fontWeight: 'bold', color: Colors.text, marginBottom: 4 },
  postContent: { fontSize: FontSizes.md, color: Colors.text, lineHeight: 22 },
  postImage: { width: '100%', height: 180, borderRadius: BorderRadius.md, marginTop: Spacing.sm },
  postFooter: { flexDirection: 'row', gap: Spacing.lg, marginTop: Spacing.sm, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border },
  footerBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerText: { fontSize: FontSizes.sm, color: Colors.textSecondary },
});
