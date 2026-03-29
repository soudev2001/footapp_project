import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TextInput,
  TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { linkParentToPlayer, getLinkedPlayers, generateLinkCode, getPendingCode } from '../../services/parentLink';
import { Ionicons } from '@expo/vector-icons';

export default function ParentLinkScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [linkedPlayers, setLinkedPlayers] = useState<any[]>([]);
  const [linkCode, setLinkCode] = useState('');
  const [pendingCode, setPendingCode] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isParent = user?.role === 'parent';
  const isPlayer = user?.role === 'player';

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      if (isParent) {
        const players = await getLinkedPlayers();
        setLinkedPlayers(players || []);
      } else if (isPlayer && user?.player?._id) {
        const code = await getPendingCode(user.player._id).catch(() => null);
        if (code?.link_code) setPendingCode(code.link_code);
      }
    } catch {} finally {
      setLoading(false);
    }
  }

  async function handleLink() {
    if (linkCode.trim().length !== 6) {
      Alert.alert('Erreur', 'Le code doit contenir 6 caractères.');
      return;
    }
    setSubmitting(true);
    try {
      await linkParentToPlayer(linkCode.trim().toUpperCase());
      Alert.alert('Succès', 'Lien parent-joueur activé.');
      setLinkCode('');
      await loadData();
    } catch {
      Alert.alert('Erreur', 'Code invalide ou expiré.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGenerateCode() {
    if (!user?.player?._id) return;
    setSubmitting(true);
    try {
      const result = await generateLinkCode(user.player._id);
      setPendingCode(result?.link_code || null);
      Alert.alert('Code généré', `Partagez ce code avec votre parent: ${result?.link_code}`);
    } catch {
      Alert.alert('Erreur', 'Impossible de générer le code.');
    } finally {
      setSubmitting(false);
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
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="people-circle" size={64} color={Colors.primary} />
        <Text style={styles.title}>Lien Parent-Joueur</Text>
        <Text style={styles.subtitle}>
          {isParent
            ? 'Associez-vous à un joueur en entrant son code de liaison.'
            : 'Générez un code pour que votre parent puisse suivre votre activité.'}
        </Text>
      </View>

      {/* Parent view: enter code to link */}
      {isParent && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Entrer un code</Text>
          <View style={styles.codeInputRow}>
            <TextInput
              style={styles.codeInput}
              placeholder="CODE"
              placeholderTextColor={Colors.textLight}
              value={linkCode}
              onChangeText={setLinkCode}
              maxLength={6}
              autoCapitalize="characters"
            />
            <TouchableOpacity
              style={[styles.linkBtn, submitting && { opacity: 0.5 }]}
              onPress={handleLink}
              disabled={submitting}
            >
              <Text style={styles.linkBtnText}>{submitting ? '...' : 'Associer'}</Text>
            </TouchableOpacity>
          </View>

          {linkedPlayers.length > 0 && (
            <View style={{ marginTop: Spacing.lg }}>
              <Text style={styles.sectionTitle}>Joueurs liés</Text>
              {linkedPlayers.map((player: any, i: number) => (
                <View key={player._id || i} style={styles.playerCard}>
                  <View style={styles.playerAvatar}>
                    <Text style={styles.playerAvatarText}>
                      {(player.first_name || 'J').charAt(0)}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.playerName}>
                      {player.first_name} {player.last_name}
                    </Text>
                    {player.position && <Text style={styles.playerPosition}>{player.position}</Text>}
                  </View>
                  {player.jersey_number && (
                    <View style={styles.jerseyBadge}>
                      <Text style={styles.jerseyText}>#{player.jersey_number}</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Player view: generate code */}
      {isPlayer && (
        <View style={styles.section}>
          {pendingCode ? (
            <View style={styles.codeDisplay}>
              <Text style={styles.codeLabel}>Votre code de liaison</Text>
              <Text style={styles.codeValue}>{pendingCode}</Text>
              <Text style={styles.codeHint}>
                Partagez ce code avec votre parent pour qu'il puisse suivre votre activité.
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.generateBtn, submitting && { opacity: 0.5 }]}
              onPress={handleGenerateCode}
              disabled={submitting}
            >
              <Ionicons name="key" size={24} color={Colors.white} />
              <Text style={styles.generateBtnText}>
                {submitting ? 'Génération...' : 'Générer un code'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={{ height: Spacing.xl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { alignItems: 'center', padding: Spacing.xl, paddingTop: Spacing.xxl },
  title: { fontSize: FontSizes.title, fontWeight: 'bold', color: Colors.text, marginTop: Spacing.md },
  subtitle: { fontSize: FontSizes.md, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.xs },
  section: { padding: Spacing.md },
  sectionTitle: { fontSize: FontSizes.xl, fontWeight: 'bold', color: Colors.text, marginBottom: Spacing.sm },
  codeInputRow: { flexDirection: 'row', gap: Spacing.sm },
  codeInput: {
    flex: 1, backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    padding: Spacing.md, fontSize: FontSizes.xxl, textAlign: 'center',
    fontWeight: 'bold', letterSpacing: 8, borderWidth: 2, borderColor: Colors.border,
  },
  linkBtn: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg, justifyContent: 'center',
  },
  linkBtnText: { color: Colors.white, fontSize: FontSizes.lg, fontWeight: 'bold' },
  playerCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  playerAvatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  playerAvatarText: { color: Colors.white, fontSize: FontSizes.lg, fontWeight: 'bold' },
  playerName: { fontSize: FontSizes.lg, fontWeight: '600', color: Colors.text },
  playerPosition: { fontSize: FontSizes.sm, color: Colors.textSecondary },
  jerseyBadge: {
    backgroundColor: Colors.secondary, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs,
  },
  jerseyText: { color: Colors.white, fontWeight: 'bold', fontSize: FontSizes.md },
  codeDisplay: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    padding: Spacing.xl, alignItems: 'center',
  },
  codeLabel: { fontSize: FontSizes.md, color: Colors.textSecondary },
  codeValue: {
    fontSize: 36, fontWeight: 'bold', color: Colors.primary,
    letterSpacing: 12, marginVertical: Spacing.md,
  },
  codeHint: { fontSize: FontSizes.sm, color: Colors.textSecondary, textAlign: 'center' },
  generateBtn: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.lg,
    padding: Spacing.lg, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: Spacing.sm,
  },
  generateBtnText: { color: Colors.white, fontSize: FontSizes.lg, fontWeight: 'bold' },
});
