import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, RefreshControl,
  TouchableOpacity, ActivityIndicator, TextInput,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import { getConversations, getDirectMessages, sendMessage, getUnreadCount } from '../../services/messaging';
import { Ionicons } from '@expo/vector-icons';

type ViewMode = 'conversations' | 'chat';

export default function MessagesScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [conversations, setConversations] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('conversations');
  const [currentChat, setCurrentChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => { loadConversations(); }, []);

  async function loadConversations() {
    try {
      const data = await getConversations();
      setConversations(data || []);
    } catch {} finally {
      setLoading(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    if (viewMode === 'conversations') {
      await loadConversations();
    } else if (currentChat) {
      await openChat(currentChat);
    }
    setRefreshing(false);
  }

  async function openChat(conv: any) {
    setCurrentChat(conv);
    setViewMode('chat');
    try {
      const otherId = conv.receiver_id || conv.sender_id || conv._id;
      const msgs = await getDirectMessages(otherId);
      setMessages(msgs || []);
    } catch {}
  }

  async function handleSend() {
    if (!newMessage.trim() || !currentChat) return;
    setSending(true);
    try {
      const otherId = currentChat.receiver_id || currentChat.sender_id || currentChat._id;
      await sendMessage(newMessage.trim(), { receiver_id: otherId });
      setNewMessage('');
      // Reload messages
      const msgs = await getDirectMessages(otherId);
      setMessages(msgs || []);
    } catch {} finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // Chat view
  if (viewMode === 'chat') {
    return (
      <View style={styles.container}>
        {/* Chat header */}
        <View style={styles.chatHeader}>
          <TouchableOpacity onPress={() => setViewMode('conversations')}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.chatHeaderTitle}>
            {currentChat?.sender_name || currentChat?.receiver_name || 'Chat'}
          </Text>
        </View>

        {/* Messages */}
        <FlatList
          data={messages}
          inverted
          keyExtractor={(item, i) => item._id || String(i)}
          contentContainerStyle={styles.messagesList}
          renderItem={({ item }) => {
            const isMe = item.sender_id === user?.id;
            return (
              <View style={[styles.messageBubble, isMe ? styles.myMessage : styles.theirMessage]}>
                {!isMe && <Text style={styles.senderName}>{item.sender_name || 'Utilisateur'}</Text>}
                <Text style={[styles.messageText, isMe && { color: Colors.white }]}>{item.content}</Text>
                <Text style={[styles.messageTime, isMe && { color: 'rgba(255,255,255,0.7)' }]}>
                  {item.created_at ? new Date(item.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}
                </Text>
              </View>
            );
          }}
        />

        {/* Input */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Écrire un message..."
            placeholderTextColor={Colors.textLight}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, !newMessage.trim() && { opacity: 0.5 }]}
            onPress={handleSend}
            disabled={!newMessage.trim() || sending}
          >
            <Ionicons name="send" size={22} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Conversation list
  return (
    <View style={styles.container}>
      <FlatList
        data={conversations}
        keyExtractor={(item, i) => item._id || String(i)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
        contentContainerStyle={conversations.length === 0 ? styles.emptyList : undefined}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubble-ellipses-outline" size={64} color={Colors.textLight} />
            <Text style={styles.emptyText}>Aucune conversation</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.convItem} onPress={() => openChat(item)}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(item.sender_name || item.receiver_name || '?')[0].toUpperCase()}
              </Text>
            </View>
            <View style={styles.convInfo}>
              <Text style={styles.convName}>{item.sender_name || item.receiver_name || 'Utilisateur'}</Text>
              <Text style={styles.convPreview} numberOfLines={1}>
                {item.content || item.last_message || ''}
              </Text>
            </View>
            <Text style={styles.convTime}>
              {item.created_at ? new Date(item.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : ''}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyList: { flex: 1 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: Colors.textSecondary, fontSize: FontSizes.lg, marginTop: Spacing.md },
  convItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: Colors.white, fontSize: FontSizes.xl, fontWeight: 'bold' },
  convInfo: { flex: 1, marginLeft: Spacing.md },
  convName: { fontSize: FontSizes.lg, fontWeight: '600', color: Colors.text },
  convPreview: { fontSize: FontSizes.md, color: Colors.textSecondary, marginTop: 2 },
  convTime: { fontSize: FontSizes.xs, color: Colors.textLight },
  // Chat
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.md,
  },
  chatHeaderTitle: { fontSize: FontSizes.xl, fontWeight: 'bold', color: Colors.text },
  messagesList: { padding: Spacing.md },
  messageBubble: {
    maxWidth: '80%',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  myMessage: {
    backgroundColor: Colors.primary,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    backgroundColor: Colors.white,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  senderName: { fontSize: FontSizes.xs, color: Colors.primary, fontWeight: '600', marginBottom: 2 },
  messageText: { fontSize: FontSizes.md, color: Colors.text },
  messageTime: { fontSize: FontSizes.xs, color: Colors.textLight, marginTop: 4, textAlign: 'right' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: Spacing.sm,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    maxHeight: 100,
    fontSize: FontSizes.md,
    color: Colors.text,
  },
  sendBtn: {
    backgroundColor: Colors.primary,
    width: 44, height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
