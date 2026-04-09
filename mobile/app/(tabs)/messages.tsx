import React, { useEffect, useState } from 'react';
import { Alert,
  View, Text, FlatList, StyleSheet, RefreshControl,
  TouchableOpacity, ActivityIndicator, TextInput,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import {
  getConversations, getDirectMessages, sendMessage, getUnreadCount,
  getTeamMessages, getChannelMessages, getChannels, markMessageRead,
} from '../../services/messaging';
import { getTeams } from '../../services/teams';
import { Ionicons } from '@expo/vector-icons';

type Tab = 'dm' | 'team' | 'channel';
type ViewMode = 'list' | 'chat';

export default function MessagesScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<Tab>('dm');
  const [conversations, setConversations] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [currentChat, setCurrentChat] = useState<any>(null);
  const [chatType, setChatType] = useState<Tab>('dm');
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    try {
      const [convos, teamList, channelList] = await Promise.all([
        getConversations().catch(() => []),
        getTeams().catch(() => []),
        getChannels().catch(() => []),
      ]);
      setConversations(convos || []);
      setTeams(teamList || []);
      setChannels(channelList || []);
    } catch (e: any) { Alert.alert('Erreur', e?.message || 'Une erreur est survenue'); } finally {
      setLoading(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    if (viewMode === 'list') {
      await loadAll();
    } else if (currentChat) {
      await loadChatMessages(currentChat, chatType);
    }
    setRefreshing(false);
  }

  async function loadChatMessages(chat: any, type: Tab) {
    try {
      let msgs: any[] = [];
      if (type === 'dm') {
        const otherId = chat.receiver_id || chat.sender_id || chat._id;
        msgs = await getDirectMessages(otherId);
      } else if (type === 'team') {
        msgs = await getTeamMessages(chat._id);
      } else if (type === 'channel') {
        msgs = await getChannelMessages(chat._id);
      }
      setMessages(msgs || []);
    } catch (e: any) { Alert.alert('Erreur', e?.message || 'Une erreur est survenue'); }
  }

  async function openChat(chat: any, type: Tab) {
    setCurrentChat(chat);
    setChatType(type);
    setViewMode('chat');
    await loadChatMessages(chat, type);
  }

  async function handleSend() {
    if (!newMessage.trim() || !currentChat) return;
    setSending(true);
    try {
      const opts: any = {};
      if (chatType === 'dm') {
        opts.receiver_id = currentChat.receiver_id || currentChat.sender_id || currentChat._id;
      } else if (chatType === 'team') {
        opts.team_id = currentChat._id;
      } else if (chatType === 'channel') {
        opts.channel_id = currentChat._id;
      }
      await sendMessage(newMessage.trim(), opts);
      setNewMessage('');
      await loadChatMessages(currentChat, chatType);
    } catch (e: any) { Alert.alert('Erreur', e?.message || 'Une erreur est survenue'); } finally {
      setSending(false);
    }
  }

  function getChatTitle() {
    if (chatType === 'team') return currentChat?.name || 'Équipe';
    if (chatType === 'channel') return `#${currentChat?.name || 'channel'}`;
    return currentChat?.sender_name || currentChat?.receiver_name || 'Chat';
  }

  function getListData() {
    if (tab === 'dm') return conversations;
    if (tab === 'team') return teams;
    return channels;
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
          <TouchableOpacity onPress={() => setViewMode('list')}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.chatHeaderTitle}>{getChatTitle()}</Text>
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

  const listData = getListData();

  // List view with tabs
  return (
    <View style={styles.container}>
      {/* Tab bar */}
      <View style={styles.tabBar}>
        {([
          { key: 'dm' as Tab, label: 'Messages', icon: 'chatbubble' },
          { key: 'team' as Tab, label: 'Équipes', icon: 'people' },
          { key: 'channel' as Tab, label: 'Channels', icon: 'megaphone' },
        ]).map(t => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tabItem, tab === t.key && styles.tabItemActive]}
            onPress={() => setTab(t.key)}
          >
            <Ionicons name={t.icon as any} size={18} color={tab === t.key ? Colors.primary : Colors.textLight} />
            <Text style={[styles.tabLabel, tab === t.key && styles.tabLabelActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={listData}
        keyExtractor={(item, i) => item._id || String(i)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
        contentContainerStyle={listData.length === 0 ? styles.emptyList : undefined}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubble-ellipses-outline" size={64} color={Colors.textLight} />
            <Text style={styles.emptyText}>
              {tab === 'dm' ? 'Aucune conversation' : tab === 'team' ? 'Aucune équipe' : 'Aucun channel'}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          if (tab === 'dm') {
            return (
              <TouchableOpacity style={styles.convItem} onPress={() => openChat(item, 'dm')}>
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
            );
          }
          if (tab === 'team') {
            return (
              <TouchableOpacity style={styles.convItem} onPress={() => openChat(item, 'team')}>
                <View style={[styles.avatar, { backgroundColor: Colors.accent }]}>
                  <Ionicons name="people" size={22} color={Colors.white} />
                </View>
                <View style={styles.convInfo}>
                  <Text style={styles.convName}>{item.name || 'Équipe'}</Text>
                  <Text style={styles.convPreview} numberOfLines={1}>{item.category || ''}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.textLight} />
              </TouchableOpacity>
            );
          }
          // channel
          return (
            <TouchableOpacity style={styles.convItem} onPress={() => openChat(item, 'channel')}>
              <View style={[styles.avatar, { backgroundColor: Colors.secondary }]}>
                <Ionicons name="megaphone" size={22} color={Colors.white} />
              </View>
              <View style={styles.convInfo}>
                <Text style={styles.convName}>#{item.name || 'channel'}</Text>
                <Text style={styles.convPreview} numberOfLines={1}>{item.description || ''}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textLight} />
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm + 2,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: { borderBottomColor: Colors.primary },
  tabLabel: { fontSize: FontSizes.sm, color: Colors.textLight },
  tabLabelActive: { color: Colors.primary, fontWeight: '600' },
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
