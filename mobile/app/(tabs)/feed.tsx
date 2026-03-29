import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, RefreshControl,
  TouchableOpacity, ActivityIndicator, TextInput, Image,
} from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import { getPosts, likePost, commentPost } from '../../services/posts';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function FeedScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [activeComment, setActiveComment] = useState<string | null>(null);
  const [filter, setFilter] = useState<string | null>(null);

  const categories = [
    { key: null, label: 'Tout' },
    { key: 'news', label: 'Actus' },
    { key: 'announcement', label: 'Annonces' },
    { key: 'match_report', label: 'Matchs' },
  ];

  useEffect(() => { loadPosts(); }, [filter]);

  async function loadPosts() {
    try {
      const data = await getPosts(undefined, filter || undefined);
      setPosts(data || []);
    } catch {} finally {
      setLoading(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadPosts();
    setRefreshing(false);
  }

  async function handleLike(postId: string) {
    try {
      await likePost(postId);
      setPosts(prev => prev.map(p =>
        p._id === postId ? { ...p, likes: (p.likes || 0) + 1 } : p
      ));
    } catch {}
  }

  async function handleComment(postId: string) {
    if (!commentText.trim()) return;
    try {
      await commentPost(postId, commentText.trim());
      setCommentText('');
      setActiveComment(null);
      await loadPosts();
    } catch {}
  }

  function getCategoryColor(cat: string) {
    switch (cat) {
      case 'news': return Colors.info;
      case 'announcement': return Colors.warning;
      case 'match_report': return Colors.success;
      default: return Colors.textSecondary;
    }
  }

  function getCategoryLabel(cat: string) {
    switch (cat) {
      case 'news': return 'Actualité';
      case 'announcement': return 'Annonce';
      case 'match_report': return 'Rapport de match';
      default: return cat;
    }
  }

  function renderPost({ item }: { item: any }) {
    const date = item.created_at ? new Date(item.created_at).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'short', year: 'numeric',
    }) : '';

    return (
      <View style={styles.postCard}>
        {/* Header */}
        <View style={styles.postHeader}>
          <View style={styles.authorRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(item.author_name || 'A').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.authorName}>{item.author_name || 'Admin'}</Text>
              <Text style={styles.postDate}>{date}</Text>
            </View>
            {item.category && (
              <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(item.category) }]}>
                <Text style={styles.categoryText}>{getCategoryLabel(item.category)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Content */}
        <Text style={styles.postTitle}>{item.title}</Text>
        {item.image && (
          <Image source={{ uri: item.image }} style={styles.postImage} resizeMode="cover" />
        )}
        <Text style={styles.postContent} numberOfLines={4}>{item.content}</Text>

        {/* Actions */}
        <View style={styles.postActions}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleLike(item._id)}>
            <Ionicons name="heart-outline" size={20} color={Colors.error} />
            <Text style={styles.actionText}>{item.likes || 0}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => setActiveComment(activeComment === item._id ? null : item._id)}
          >
            <Ionicons name="chatbubble-outline" size={20} color={Colors.accent} />
            <Text style={styles.actionText}>{item.comments?.length || 0}</Text>
          </TouchableOpacity>
        </View>

        {/* Comments */}
        {item.comments && item.comments.length > 0 && (
          <View style={styles.commentsSection}>
            {item.comments.slice(-3).map((c: any, i: number) => (
              <View key={i} style={styles.commentItem}>
                <Text style={styles.commentAuthor}>{c.author_name || 'Utilisateur'}</Text>
                <Text style={styles.commentText}>{c.text || c.comment}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Comment input */}
        {activeComment === item._id && (
          <View style={styles.commentInput}>
            <TextInput
              style={styles.commentField}
              placeholder="Ajouter un commentaire..."
              placeholderTextColor={Colors.textLight}
              value={commentText}
              onChangeText={setCommentText}
            />
            <TouchableOpacity onPress={() => handleComment(item._id)}>
              <Ionicons name="send" size={24} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
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
      {/* Category filter */}
      <View style={styles.filterRow}>
        {categories.map(cat => (
          <TouchableOpacity
            key={cat.key || 'all'}
            style={[styles.filterChip, filter === cat.key && styles.filterChipActive]}
            onPress={() => setFilter(cat.key)}
          >
            <Text style={[styles.filterText, filter === cat.key && styles.filterTextActive]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item._id}
        renderItem={renderPost}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
        contentContainerStyle={{ paddingBottom: Spacing.xl }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="newspaper-outline" size={48} color={Colors.textLight} />
            <Text style={styles.emptyText}>Aucune publication</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  filterRow: {
    flexDirection: 'row', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, gap: Spacing.xs,
  },
  filterChip: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full, backgroundColor: Colors.white,
    borderWidth: 1, borderColor: Colors.border,
  },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { fontSize: FontSizes.sm, color: Colors.text },
  filterTextActive: { color: Colors.white, fontWeight: 'bold' },
  postCard: {
    backgroundColor: Colors.white, marginHorizontal: Spacing.md, marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg, padding: Spacing.md,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  postHeader: { marginBottom: Spacing.sm },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  avatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: Colors.white, fontSize: FontSizes.lg, fontWeight: 'bold' },
  authorName: { fontSize: FontSizes.md, fontWeight: '600', color: Colors.text },
  postDate: { fontSize: FontSizes.xs, color: Colors.textSecondary },
  categoryBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.full },
  categoryText: { fontSize: FontSizes.xs, color: Colors.white, fontWeight: 'bold' },
  postTitle: { fontSize: FontSizes.lg, fontWeight: 'bold', color: Colors.text, marginBottom: Spacing.xs },
  postImage: { width: '100%', height: 200, borderRadius: BorderRadius.md, marginBottom: Spacing.sm },
  postContent: { fontSize: FontSizes.md, color: Colors.textSecondary, lineHeight: 20 },
  postActions: {
    flexDirection: 'row', gap: Spacing.lg, marginTop: Spacing.md,
    paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  actionText: { fontSize: FontSizes.sm, color: Colors.textSecondary },
  commentsSection: { marginTop: Spacing.sm, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border },
  commentItem: { marginBottom: Spacing.xs },
  commentAuthor: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.text },
  commentText: { fontSize: FontSizes.sm, color: Colors.textSecondary },
  commentInput: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    marginTop: Spacing.sm, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  commentField: {
    flex: 1, backgroundColor: Colors.background, borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, fontSize: FontSizes.md,
  },
  emptyContainer: { alignItems: 'center', paddingTop: Spacing.xxl },
  emptyText: { fontSize: FontSizes.lg, color: Colors.textLight, marginTop: Spacing.sm },
});
