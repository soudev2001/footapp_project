import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl,
  TouchableOpacity, TextInput, Alert,
} from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import { getComments, createComment, getPolls, createPoll, votePoll } from '../../services/fan';
import { Ionicons } from '@expo/vector-icons';

export default function CommunityScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<'feed' | 'polls'>('feed');
  const [comments, setComments] = useState<any[]>([]);
  const [polls, setPolls] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [showPollForm, setShowPollForm] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState('');

  const load = useCallback(async () => {
    try {
      const [c, p] = await Promise.all([getComments('general'), getPolls()]);
      setComments(c || []);
      setPolls(p || []);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function onRefresh() { setRefreshing(true); await load(); setRefreshing(false); }

  async function handleComment() {
    if (!commentText.trim()) return;
    try {
      await createComment('general', commentText.trim());
      setCommentText('');
      await load();
    } catch { Alert.alert('Erreur', 'Impossible d\'envoyer le commentaire'); }
  }

  async function handleCreatePoll() {
    const options = pollOptions.split('\n').map((o) => o.trim()).filter(Boolean);
    if (!pollQuestion.trim() || options.length < 2) { Alert.alert('Erreur', 'Question et au moins 2 options requises'); return; }
    try {
      await createPoll(pollQuestion.trim(), options);
      setShowPollForm(false); setPollQuestion(''); setPollOptions('');
      await load();
    } catch { Alert.alert('Erreur', 'Impossible de créer le sondage'); }
  }

  async function handleVote(pollId: string, idx: number) {
    try { await votePoll(pollId, idx); await load(); }
    catch { Alert.alert('Erreur', 'Vote échoué'); }
  }

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}>
      <View style={{ padding: Spacing.md }}>
        <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md }}>
          {[
            { key: 'feed' as const, label: 'Discussions', icon: 'chatbubbles' as const },
            { key: 'polls' as const, label: 'Sondages', icon: 'stats-chart' as const },
          ].map((t) => (
            <TouchableOpacity key={t.key} style={[styles.tabBtn, tab === t.key && styles.tabActive]} onPress={() => setTab(t.key)}>
              <Ionicons name={t.icon} size={16} color={tab === t.key ? '#fff' : Colors.textSecondary} />
              <Text style={[styles.tabText, tab === t.key && { color: '#fff' }]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {tab === 'feed' && (
          <>
            <View style={[styles.card, { flexDirection: 'row', gap: Spacing.sm }]}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Écrire un commentaire..."
                placeholderTextColor={Colors.textLight}
                value={commentText}
                onChangeText={setCommentText}
              />
              <TouchableOpacity style={styles.sendBtn} onPress={handleComment}>
                <Ionicons name="send" size={18} color="#fff" />
              </TouchableOpacity>
            </View>

            {comments.map((comment: any) => (
              <View key={comment.id || comment._id} style={styles.card}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={styles.cardTitle}>{comment.author_name}</Text>
                  <Text style={styles.cardSub}>{comment.created_at}</Text>
                </View>
                <Text style={{ fontSize: FontSizes.md, color: Colors.text, marginTop: Spacing.xs }}>{comment.content}</Text>
                {comment.replies?.map((reply: any) => (
                  <View key={reply.id || reply._id} style={styles.reply}>
                    <Text style={{ fontSize: FontSizes.sm, color: Colors.textSecondary }}>
                      <Text style={{ fontWeight: '600', color: Colors.text }}>{reply.author_name}</Text> · {reply.created_at}
                    </Text>
                    <Text style={{ fontSize: FontSizes.sm, color: Colors.textSecondary, marginTop: 2 }}>{reply.content}</Text>
                  </View>
                ))}
              </View>
            ))}

            {!comments.length && (
              <View style={styles.empty}>
                <Ionicons name="chatbubble-outline" size={40} color={Colors.textLight} />
                <Text style={styles.emptyText}>Aucun commentaire</Text>
              </View>
            )}
          </>
        )}

        {tab === 'polls' && (
          <>
            <TouchableOpacity style={styles.btnPrimary} onPress={() => setShowPollForm(!showPollForm)}>
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={styles.btnText}>Créer un sondage</Text>
            </TouchableOpacity>

            {showPollForm && (
              <View style={[styles.card, { borderColor: Colors.primary, borderWidth: 1, marginTop: Spacing.sm }]}>
                <TextInput
                  style={styles.input}
                  placeholder="Question"
                  placeholderTextColor={Colors.textLight}
                  value={pollQuestion}
                  onChangeText={setPollQuestion}
                />
                <TextInput
                  style={[styles.input, { height: 80, textAlignVertical: 'top', marginTop: Spacing.xs }]}
                  placeholder="Options (une par ligne)"
                  placeholderTextColor={Colors.textLight}
                  multiline
                  value={pollOptions}
                  onChangeText={setPollOptions}
                />
                <TouchableOpacity style={[styles.btnPrimary, { marginTop: Spacing.sm }]} onPress={handleCreatePoll}>
                  <Text style={styles.btnText}>Publier</Text>
                </TouchableOpacity>
              </View>
            )}

            {polls.map((poll: any) => (
              <View key={poll.id || poll._id} style={[styles.card, { marginTop: Spacing.sm }]}>
                <Text style={styles.cardTitle}>{poll.question}</Text>
                <Text style={[styles.cardSub, { marginBottom: Spacing.sm }]}>{poll.total_votes} vote(s)</Text>
                {poll.options?.map((opt: any, i: number) => {
                  const pct = poll.total_votes > 0 ? (opt.votes / poll.total_votes) * 100 : 0;
                  return (
                    <TouchableOpacity key={i} onPress={() => !poll.voted && handleVote(poll.id || poll._id, i)} disabled={poll.voted} style={{ marginBottom: Spacing.xs }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
                        <Text style={{ fontSize: FontSizes.sm, color: Colors.text }}>{opt.text}</Text>
                        <Text style={{ fontSize: FontSizes.sm, color: Colors.textSecondary }}>{Math.round(pct)}%</Text>
                      </View>
                      <View style={styles.progressBg}>
                        <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: Colors.primary }]} />
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.lg, backgroundColor: Colors.card },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.textSecondary },
  card: { backgroundColor: Colors.card, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.sm, elevation: 2 },
  cardTitle: { fontSize: FontSizes.md, fontWeight: '600', color: Colors.text },
  cardSub: { fontSize: FontSizes.sm, color: Colors.textSecondary },
  input: { backgroundColor: Colors.background, borderRadius: BorderRadius.md, padding: Spacing.sm, fontSize: FontSizes.md, color: Colors.text },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  btnPrimary: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, alignSelf: 'flex-start' },
  btnText: { fontSize: FontSizes.md, fontWeight: '600', color: '#fff' },
  reply: { marginLeft: Spacing.lg, paddingLeft: Spacing.sm, borderLeftWidth: 2, borderLeftColor: '#E0E0E0', marginTop: Spacing.sm },
  progressBg: { height: 6, backgroundColor: '#E0E0E0', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  empty: { alignItems: 'center', padding: Spacing.xl },
  emptyText: { color: Colors.textLight, marginTop: Spacing.sm, fontSize: FontSizes.md },
});
