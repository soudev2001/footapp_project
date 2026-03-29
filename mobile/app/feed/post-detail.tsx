import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform, FlatList,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import { getPost, likePost, commentPost } from '../../services/posts';
import { Ionicons } from '@expo/vector-icons';

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState<any>(null);
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => { if (id) load(); }, [id]);

  async function load() {
    try { const d = await getPost(id!); setPost(d); }
    catch {} finally { setLoading(false); }
  }

  async function handleLike() {
    try {
      await likePost(id!);
      setPost((p: any) => ({ ...p, liked: !p.liked, likes_count: (p.likes_count || 0) + (p.liked ? -1 : 1) }));
    } catch {}
  }

  async function handleComment() {
    if (!comment.trim()) return;
    setSending(true);
    try {
      await commentPost(id!, comment.trim());
      setComment('');
      load();
    } catch {} finally { setSending(false); }
  }

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  if (!post) return <View style={styles.centered}><Text>Publication introuvable</Text></View>;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container}>
        <View style={{ padding: Spacing.md }}>
          <View style={styles.header}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{(post.author_name?.[0] || '?').toUpperCase()}</Text>
            </View>
            <View>
              <Text style={styles.authorName}>{post.author_name || 'Anonyme'}</Text>
              <Text style={styles.date}>{post.created_at ? new Date(post.created_at).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) : ''}</Text>
            </View>
          </View>

          {post.title && <Text style={styles.title}>{post.title}</Text>}
          <Text style={styles.content}>{post.content}</Text>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
              <Ionicons name={post.liked ? 'heart' : 'heart-outline'} size={22} color={post.liked ? Colors.error : Colors.textSecondary} />
              <Text style={styles.actionText}>{post.likes_count || 0} J'aime</Text>
            </TouchableOpacity>
            <View style={styles.actionBtn}>
              <Ionicons name="chatbubble-outline" size={20} color={Colors.textSecondary} />
              <Text style={styles.actionText}>{(post.comments || []).length} Commentaire{(post.comments || []).length > 1 ? 's' : ''}</Text>
            </View>
          </View>

          {/* Comments */}
          <Text style={styles.sectionTitle}>Commentaires</Text>
          {(post.comments || []).map((c: any, i: number) => (
            <View key={i} style={styles.commentCard}>
              <View style={styles.commentHeader}>
                <Text style={styles.commentAuthor}>{c.author_name || 'Anonyme'}</Text>
                <Text style={styles.commentDate}>{c.created_at ? new Date(c.created_at).toLocaleDateString('fr-FR') : ''}</Text>
              </View>
              <Text style={styles.commentText}>{c.content}</Text>
            </View>
          ))}

          {/* Comment input */}
          <View style={styles.commentInput}>
            <TextInput style={styles.input} value={comment} onChangeText={setComment}
              placeholder="Écrire un commentaire..." multiline />
            <TouchableOpacity style={styles.sendBtn} onPress={handleComment} disabled={sending}>
              {sending ? <ActivityIndicator size="small" color={Colors.white} /> :
                <Ionicons name="send" size={20} color={Colors.white} />}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary + '20', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontWeight: 'bold', color: Colors.primary, fontSize: FontSizes.lg },
  authorName: { fontWeight: '600', color: Colors.text, fontSize: FontSizes.md },
  date: { fontSize: FontSizes.sm, color: Colors.textSecondary },
  title: { fontSize: FontSizes.title, fontWeight: 'bold', color: Colors.text, marginBottom: Spacing.sm },
  content: { fontSize: FontSizes.md, color: Colors.text, lineHeight: 24 },
  actions: { flexDirection: 'row', gap: Spacing.lg, paddingVertical: Spacing.md, borderTopWidth: 1, borderBottomWidth: 1, borderColor: Colors.border, marginVertical: Spacing.md },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionText: { fontSize: FontSizes.sm, color: Colors.textSecondary },
  sectionTitle: { fontSize: FontSizes.lg, fontWeight: 'bold', color: Colors.text, marginBottom: Spacing.sm },
  commentCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.sm },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  commentAuthor: { fontWeight: '600', fontSize: FontSizes.sm, color: Colors.text },
  commentDate: { fontSize: FontSizes.xs, color: Colors.textSecondary },
  commentText: { fontSize: FontSizes.md, color: Colors.text },
  commentInput: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md, marginBottom: Spacing.xl },
  input: { flex: 1, backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, fontSize: FontSizes.md, borderWidth: 1, borderColor: Colors.border },
  sendBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.lg, width: 44, height: 44, justifyContent: 'center', alignItems: 'center', alignSelf: 'flex-end' },
});
