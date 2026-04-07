import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl,
  TouchableOpacity, Image, Dimensions, Modal,
} from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import { getMedia } from '../../services/fan';
import { Ionicons } from '@expo/vector-icons';

const SCREEN_WIDTH = Dimensions.get('window').width;
const ITEM_SIZE = (SCREEN_WIDTH - Spacing.md * 2 - Spacing.sm * 2) / 3;
const CATEGORIES = ['Tous', 'Matchs', 'Entraînements', 'Événements', 'Coulisses'];

export default function MediaScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [media, setMedia] = useState<any[]>([]);
  const [category, setCategory] = useState('Tous');
  const [selectedMedia, setSelectedMedia] = useState<any | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await getMedia(category === 'Tous' ? undefined : category);
      setMedia(data || []);
    } catch {} finally { setLoading(false); }
  }, [category]);

  useEffect(() => { setLoading(true); load(); }, [load]);

  async function onRefresh() { setRefreshing(true); await load(); setRefreshing(false); }

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 44, marginBottom: Spacing.sm }} contentContainerStyle={{ paddingHorizontal: Spacing.md, gap: Spacing.xs }}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity key={cat} style={[styles.chip, category === cat && styles.chipActive]} onPress={() => setCategory(cat)}>
            <Text style={[styles.chipText, category === cat && { color: '#fff' }]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />} contentContainerStyle={{ paddingHorizontal: Spacing.md }}>
        <View style={styles.grid}>
          {media.map((item: any) => (
            <TouchableOpacity key={item.id || item._id} style={styles.gridItem} onPress={() => setSelectedMedia(item)}>
              <Image source={{ uri: item.thumbnail_url || item.url }} style={styles.thumb} />
              {item.type === 'video' && (
                <View style={styles.playOverlay}>
                  <Ionicons name="play-circle" size={30} color="rgba(255,255,255,0.9)" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {!media.length && (
          <View style={styles.empty}>
            <Ionicons name="images-outline" size={40} color={Colors.textLight} />
            <Text style={styles.emptyText}>Aucun média</Text>
          </View>
        )}
      </ScrollView>

      {/* Lightbox */}
      <Modal visible={!!selectedMedia} transparent animationType="fade" onRequestClose={() => setSelectedMedia(null)}>
        <View style={styles.modalBg}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedMedia(null)}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          {selectedMedia && (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <Image source={{ uri: selectedMedia.url }} style={styles.fullImage} resizeMode="contain" />
              {selectedMedia.title && <Text style={styles.mediaTitle}>{selectedMedia.title}</Text>}
              {selectedMedia.description && <Text style={styles.mediaDesc}>{selectedMedia.description}</Text>}
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, paddingTop: Spacing.md },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  chip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.lg, backgroundColor: Colors.card, elevation: 1 },
  chipActive: { backgroundColor: Colors.primary },
  chipText: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.textSecondary },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  gridItem: { width: ITEM_SIZE, height: ITEM_SIZE, borderRadius: BorderRadius.md, overflow: 'hidden', backgroundColor: '#E0E0E0' },
  thumb: { width: '100%', height: '100%' },
  playOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.25)' },
  empty: { alignItems: 'center', padding: Spacing.xl },
  emptyText: { color: Colors.textLight, marginTop: Spacing.sm, fontSize: FontSizes.md },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)' },
  closeBtn: { position: 'absolute', top: 50, right: 20, zIndex: 10 },
  fullImage: { width: SCREEN_WIDTH - 40, height: SCREEN_WIDTH - 40 },
  mediaTitle: { color: '#fff', fontSize: FontSizes.lg, fontWeight: '600', marginTop: Spacing.md, textAlign: 'center' },
  mediaDesc: { color: 'rgba(255,255,255,0.7)', fontSize: FontSizes.md, marginTop: Spacing.xs, textAlign: 'center', paddingHorizontal: Spacing.lg },
});
