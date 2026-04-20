import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { messagesApi, adminApi } from '../api'
import { Send, Hash, User, Search, Plus, UserPlus, X, MessageSquare, ChevronRight, Hash as HashIcon, Users } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useAuthStore } from '../store/auth'
import type { Conversation, Message, User as AppUser } from '../types'
import clsx from 'clsx'

export default function Messages() {
  const qc = useQueryClient()
  const { user } = useAuthStore()
  const [active, setActive] = useState<Conversation | null>(null)
  const [text, setText] = useState('')
  const [showNewChat, setShowNewChat] = useState(false)
  const [searchMember, setSearchMember] = useState('')

  const { data: conversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => messagesApi.conversations().then((r) => r.data),
  })

  const { data: members } = useQuery({
    queryKey: ['admin-members'],
    queryFn: () => adminApi.members().then((r) => {
      const raw = r.data
      return (Array.isArray(raw) ? raw : raw?.members ?? []) as AppUser[]
    }),
    enabled: showNewChat,
  })

  const { data: history } = useQuery({
    queryKey: ['messages', active?.id],
    queryFn: () => {
      if (!active) return []
      if (active.other_user_id)
        return messagesApi.directHistory(active.other_user_id).then((r) => r.data)
      if (active.team_id)
        return messagesApi.teamHistory(active.team_id).then((r) => r.data)
      return []
    },
    enabled: !!active,
    refetchInterval: 5_000,
  })

  const sendMutation = useMutation({
    mutationFn: (payload?: { rec_id?: string; content: string; type: 'direct' | 'team' }) =>
      messagesApi.send({
        receiver_id: payload?.rec_id ?? active?.other_user_id,
        team_id: active?.team_id,
        content: payload?.content ?? text,
        type: (payload?.type ?? (active?.type === 'direct' ? 'direct' : 'team')) as 'direct' | 'team',
      }),
    onSuccess: () => {
      setText('')
      qc.invalidateQueries({ queryKey: ['messages', active?.id] })
      qc.invalidateQueries({ queryKey: ['conversations'] })
    },
  })

  const startDirectChat = (targetUser: AppUser) => {
    // Search if conversation already exists
    const existing = conversations?.find(c => c.other_user_id === targetUser.id)
    if (existing) {
      setActive(existing)
    } else {
      // Create local temporary active object to start chatting
      setActive({
        id: `temp-${targetUser.id}`,
        type: 'direct',
        name: `${targetUser.profile.first_name} ${targetUser.profile.last_name}`,
        other_user_id: targetUser.id,
        unread_count: 0
      })
    }
    setShowNewChat(false)
  }

  const filteredMembers = useMemo(() => {
    if (!members) return []
    const q = searchMember.toLowerCase()
    return members.filter(m => 
      `${m.profile.first_name} ${m.profile.last_name}`.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q)
    ).filter(m => m.id !== user?.id)
  }, [members, searchMember, user])

  const groupedConvs = useMemo(() => {
    const channels = conversations?.filter(c => c.type === 'team' || c.type === 'channel') ?? []
    const direct = conversations?.filter(c => c.type === 'direct') ?? []
    return { channels, direct }
  }, [conversations])

  const handleSend = () => {
    if (!text.trim()) return
    sendMutation.mutate()
  }

  return (
    <div className="h-[calc(100vh-6rem)] sm:h-[calc(100vh-8rem)] flex gap-4 overflow-hidden -m-4 sm:m-0 p-4">
      {/* Sidebar */}
      <div className="w-full sm:w-80 shrink-0 flex flex-col gap-3">
        <div className="flex items-center justify-between px-2">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <MessageSquare size={20} className="text-pitch-500" /> Messages
          </h1>
          <button 
            onClick={() => setShowNewChat(true)}
            className="p-2 rounded-full bg-pitch-600/20 text-pitch-400 hover:bg-pitch-600 hover:text-white transition-all shadow-lg"
            title="Nouveau message"
          >
            <Plus size={18} />
          </button>
        </div>

        <div className="bg-gray-900/50 border border-white/5 rounded-2xl flex-1 overflow-y-auto p-2 space-y-4 custom-scrollbar">
          {/* Channels Section */}
          <section className="space-y-1">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-3 mb-2 flex items-center gap-2">
              <Users size={12} /> Canaux & Équipes
            </p>
            {groupedConvs.channels.map(conv => (
              <ConversationItem key={conv.id} conv={conv} active={active?.id === conv.id} onClick={() => setActive(conv)} />
            ))}
            {groupedConvs.channels.length === 0 && (
              <p className="text-[10px] text-gray-600 px-3 py-1 italic">Aucun canal groupé</p>
            )}
          </section>

          {/* Direct Messages Section */}
          <section className="space-y-1">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-3 mb-2 flex items-center gap-2">
              <User size={12} /> Messages Directs
            </p>
            {groupedConvs.direct.map(conv => (
              <ConversationItem key={conv.id} conv={conv} active={active?.id === conv.id} onClick={() => setActive(conv)} />
            ))}
          </section>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 bg-gray-900/40 border border-white/5 rounded-2xl flex flex-col overflow-hidden relative shadow-2xl">
        {active ? (
          <>
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/5 bg-gray-900/40 backdrop-blur-md flex items-center justify-between z-10">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pitch-600 to-pitch-800 flex items-center justify-center text-white font-bold text-lg shadow-inner">
                  {active.name[0]}
                </div>
                <div>
                  <h2 className="font-bold text-white leading-tight">{active.name}</h2>
                  <p className="text-[10px] text-pitch-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-pitch-500 animate-pulse" />
                    En ligne
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[url('/grid.svg')] bg-repeat">
              {history?.map((msg: Message, i: number) => {
                const isMe = msg.sender_id === user?.id
                const prevMsg = i > 0 ? history[i-1] : null
                const showHeader = !prevMsg || prevMsg.sender_id !== msg.sender_id

                return (
                  <div key={msg.id} className={clsx("flex flex-col", isMe ? "items-end" : "items-start")}>
                    {showHeader && !isMe && (
                      <span className="text-[10px] font-bold text-gray-500 mb-1 ml-1 uppercase tracking-tighter">
                        {msg.sender_name}
                      </span>
                    )}
                    <div className={clsx(
                      "group relative px-4 py-2.5 rounded-2xl text-sm max-w-[85%] sm:max-w-[70%] transition-transform hover:scale-[1.01]",
                      isMe 
                        ? "bg-pitch-600 text-white rounded-tr-none shadow-pitch-900/20 shadow-lg" 
                        : "bg-gray-800 text-gray-200 rounded-tl-none border border-white/5 shadow-black/20 shadow-md"
                    )}>
                      {msg.content}
                      <span className={clsx(
                        "absolute -bottom-5 text-[9px] text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap",
                        isMe ? "right-0" : "left-0"
                      )}>
                        {format(new Date(msg.created_at), 'HH:mm')}
                      </span>
                    </div>
                  </div>
                )
              })}
              {!history?.length && (
                <div className="flex flex-col items-center justify-center h-full text-gray-600">
                  <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mb-4">
                    <MessageSquare size={32} />
                  </div>
                  <p className="text-sm">Démarrez la conversation par un message !</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-gray-900/60 backdrop-blur-xl border-t border-white/5">
              <div className="relative flex items-center gap-2">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder="Écrivez votre message..."
                  className="flex-1 h-12 bg-gray-800/80 border border-white/10 rounded-xl px-4 text-sm text-white focus:outline-none focus:border-pitch-500/50 focus:ring-1 focus:ring-pitch-500/20 transition-all placeholder-gray-500"
                />
                <button
                  onClick={handleSend}
                  disabled={!text.trim() || sendMutation.isPending}
                  className="w-12 h-12 rounded-xl bg-pitch-600 flex items-center justify-center text-white shadow-lg shadow-pitch-600/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-8 text-center">
            <div className="w-24 h-24 rounded-full bg-gray-900/80 border border-white/5 flex items-center justify-center mb-6 shadow-2xl">
              <MessageSquare size={48} className="text-gray-700" />
            </div>
            <h3 className="text-lg font-bold text-gray-400 mb-2">Sélectionnez une conversation</h3>
            <p className="text-sm max-w-xs leading-relaxed">Choisissez un membre ou un canal dans la liste pour commencer à échanger en temps réel.</p>
          </div>
        )}
      </div>

      {/* New Member Search Modal */}
      {showNewChat && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-white/10 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <UserPlus size={20} className="text-pitch-500" /> Nouveau Message
                </h2>
                <p className="text-xs text-gray-500">Recherchez un membre du club</p>
              </div>
              <button onClick={() => setShowNewChat(false)} className="p-2 rounded-full hover:bg-gray-800 text-gray-500">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input 
                  autoFocus
                  placeholder="Rechercher par nom ou rôle..." 
                  className="input pl-10"
                  value={searchMember}
                  onChange={(e) => setSearchMember(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
              {filteredMembers.map((m) => (
                <button
                  key={m.id}
                  onClick={() => startDirectChat(m)}
                  className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-gray-800/80 transition-all text-left group"
                >
                  <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-lg font-bold text-white/50 group-hover:text-white group-hover:bg-pitch-900/50 transition-all">
                    {m.profile.first_name[0]}{m.profile.last_name[0]}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-white text-sm">{m.profile.first_name} {m.profile.last_name}</p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 capitalize border border-white/5 font-medium">
                      {m.role}
                    </span>
                  </div>
                  <ChevronRight size={16} className="text-gray-700 group-hover:text-pitch-500 transition-all" />
                </button>
              ))}
              {filteredMembers.length === 0 && (
                <div className="py-12 text-center text-gray-600">
                  <Search size={32} className="mx-auto mb-2 opacity-20" />
                  <p className="text-sm">Aucun membre trouvé</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ConversationItem({ conv, active, onClick }: { conv: Conversation; active: boolean; onClick: () => void }) {
  const isTypeChannel = conv.type === 'channel' || conv.type === 'team'
  return (
    <button
      onClick={onClick}
      className={clsx(
        'w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all group border border-transparent',
        active 
          ? 'bg-pitch-600/20 border-pitch-500/20 shadow-lg' 
          : 'hover:bg-white/5'
      )}
    >
      <div className={clsx(
        "w-11 h-11 rounded-full flex items-center justify-center font-bold text-lg shrink-0 shadow-inner",
        active 
          ? "bg-pitch-600 text-white" 
          : "bg-gray-800 text-gray-500 group-hover:bg-gray-700 group-hover:text-gray-400"
      )}>
        {isTypeChannel ? <HashIcon size={20} /> : conv.name?.[0]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className={clsx("text-sm font-bold truncate", active ? "text-white" : "text-gray-300 group-hover:text-white")}>
            {conv.name}
          </p>
          {conv.last_message_at && (
            <span className="text-[9px] text-gray-600 font-medium">
              {format(new Date(conv.last_message_at), 'HH:mm')}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className="text-[11px] text-gray-500 truncate font-medium">
            {conv.last_message || "Démarrer une discussion"}
          </p>
          {conv.unread_count > 0 && (
            <span className="min-w-[18px] h-[18px] flex items-center justify-center bg-pitch-600 text-white text-[9px] font-black rounded-full shadow-lg shadow-pitch-600/30">
              {conv.unread_count}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}
