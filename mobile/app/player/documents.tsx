import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, Alert,
} from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import { getPlayerDocuments, uploadPlayerDocument } from '../../services/player';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

const DOC_ITEMS = [
  { key: 'licence', label: 'Licence', icon: 'card', isImage: false },
  { key: 'medical_cert', label: 'Certificat médical', icon: 'medkit', isImage: false },
  { key: 'id_card', label: "Pièce d'identité", icon: 'person', isImage: false },
  { key: 'insurance', label: 'Assurance', icon: 'shield-checkmark', isImage: false },
  { key: 'photo', label: 'Photo', icon: 'camera', isImage: true },
];

export default function DocumentsScreen() {
  const [loading, setLoading] = useState(true);
  const [docs, setDocs] = useState<any>({});
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const data = await getPlayerDocuments();
      setDocs(data || {});
    } catch (e: any) { Alert.alert('Erreur', e?.message || 'Une erreur est survenue'); } finally { setLoading(false); }
  }

  async function pickAndUpload(docKey: string, isImage: boolean) {
    try {
      let uri = '';
      let mimeType = 'application/pdf';
      let fileName = `${docKey}.pdf`;

      if (isImage) {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          Alert.alert('Permission refusée', 'Accès à la galerie requis.');
          return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
        });
        if (result.canceled) return;
        const asset = result.assets[0];
        uri = asset.uri;
        mimeType = asset.mimeType ?? 'image/jpeg';
        fileName = asset.fileName ?? `${docKey}.jpg`;
      } else {
        const result = await DocumentPicker.getDocumentAsync({
          type: ['application/pdf', 'image/*'],
          copyToCacheDirectory: true,
        });
        if (result.canceled) return;
        const asset = result.assets[0];
        uri = asset.uri;
        mimeType = asset.mimeType ?? 'application/pdf';
        fileName = asset.name ?? `${docKey}.pdf`;
      }

      setUploading(docKey);
      await uploadPlayerDocument(docKey, uri, mimeType, fileName);
      await load();
      Alert.alert('Succès', 'Document téléversé avec succès.');
    } catch {
      Alert.alert('Erreur', 'Impossible de téléverser le document.');
    } finally {
      setUploading(null);
    }
  }

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: Spacing.md }}>
      <Text style={styles.title}>Mes documents</Text>
      {DOC_ITEMS.map(d => {
        const value = docs[d.key];
        const isProvided = value?.status === 'provided' || !!value?.file || (typeof value === 'string' && value.length > 0);
        const isUploading = uploading === d.key;
        return (
          <View key={d.key} style={styles.card}>
            <View style={[styles.iconWrap, { backgroundColor: isProvided ? Colors.success + '20' : Colors.border }]}>
              <Ionicons name={d.icon as any} size={24} color={isProvided ? Colors.success : Colors.textLight} />
            </View>
            <View style={styles.info}>
              <Text style={styles.docLabel}>{d.label}</Text>
              <Text style={[styles.docStatus, { color: isProvided ? Colors.success : Colors.textSecondary }]}>
                {isProvided ? 'Fourni ✓' : 'Non fourni'}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.uploadBtn, isProvided && styles.uploadBtnDone]}
              onPress={() => pickAndUpload(d.key, d.isImage)}
              disabled={isUploading}
            >
              {isUploading
                ? <ActivityIndicator size="small" color={Colors.white} />
                : <Ionicons name={isProvided ? 'refresh' : 'cloud-upload'} size={18} color={Colors.white} />
              }
            </TouchableOpacity>
          </View>
        );
      })}
      <View style={{ height: Spacing.xl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: FontSizes.title, fontWeight: 'bold', color: Colors.text, marginBottom: Spacing.md },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.sm, elevation: 1,
  },
  iconWrap: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md },
  info: { flex: 1 },
  docLabel: { fontSize: FontSizes.lg, fontWeight: '600', color: Colors.text },
  docStatus: { fontSize: FontSizes.sm, marginTop: 2 },
  uploadBtn: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    padding: Spacing.sm, justifyContent: 'center', alignItems: 'center', minWidth: 40,
  },
  uploadBtnDone: { backgroundColor: Colors.textSecondary },
});
