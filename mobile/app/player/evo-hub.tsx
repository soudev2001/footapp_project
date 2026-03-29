import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
} from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import { getPlayerEvolution } from '../../services/player';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Polygon, Line, Circle, Text as SvgText } from 'react-native-svg';

const RADAR_SIZE = 220;
const CENTER = RADAR_SIZE / 2;
const RADIUS = 80;
const LABEL_OFFSET = 18;
const RATING_KEYS = ['VIT', 'TIR', 'PAS', 'DRI', 'DEF', 'PHY'];

function angleFor(i: number) {
  // Start from top (-π/2), clockwise
  return (i / RATING_KEYS.length) * 2 * Math.PI - Math.PI / 2;
}

function pointAt(angle: number, r: number) {
  return {
    x: CENTER + r * Math.cos(angle),
    y: CENTER + r * Math.sin(angle),
  };
}

function RadarChart({ values }: { values: number[] }) {
  const levels = [20, 40, 60, 80, 100];

  const dataPoints = RATING_KEYS.map((_, i) => {
    const v = Math.min(Math.max(values[i] ?? 0, 0), 100);
    const pt = pointAt(angleFor(i), (v / 100) * RADIUS);
    return `${pt.x},${pt.y}`;
  }).join(' ');

  return (
    <Svg width={RADAR_SIZE} height={RADAR_SIZE}>
      {/* Background grid levels */}
      {levels.map(level => {
        const pts = RATING_KEYS.map((_, i) => {
          const pt = pointAt(angleFor(i), (level / 100) * RADIUS);
          return `${pt.x},${pt.y}`;
        }).join(' ');
        return (
          <Polygon key={level} points={pts}
            fill="none" stroke={Colors.border} strokeWidth={1} />
        );
      })}

      {/* Axis lines */}
      {RATING_KEYS.map((_, i) => {
        const outer = pointAt(angleFor(i), RADIUS);
        return (
          <Line key={i} x1={CENTER} y1={CENTER}
            x2={outer.x} y2={outer.y}
            stroke={Colors.border} strokeWidth={1} />
        );
      })}

      {/* Data polygon */}
      <Polygon points={dataPoints}
        fill={Colors.primary + '40'} stroke={Colors.primary} strokeWidth={2} />

      {/* Data points */}
      {RATING_KEYS.map((_, i) => {
        const v = Math.min(Math.max(values[i] ?? 0, 0), 100);
        const pt = pointAt(angleFor(i), (v / 100) * RADIUS);
        return <Circle key={i} cx={pt.x} cy={pt.y} r={4} fill={Colors.primary} />;
      })}

      {/* Labels */}
      {RATING_KEYS.map((key, i) => {
        const outer = pointAt(angleFor(i), RADIUS + LABEL_OFFSET);
        return (
          <SvgText key={key} x={outer.x} y={outer.y + 4}
            textAnchor="middle" fontSize={11} fontWeight="bold"
            fill={Colors.text}>
            {key}
          </SvgText>
        );
      })}
    </Svg>
  );
}

export default function EvoHubScreen() {
  const [loading, setLoading] = useState(true);
  const [evo, setEvo] = useState<any>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const data = await getPlayerEvolution();
      setEvo(data);
    } catch {} finally { setLoading(false); }
  }

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  const ratings = evo?.technical_ratings || {};
  const radarValues = RATING_KEYS.map(k => ratings[k] ?? ratings[k.toLowerCase()] ?? 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: Spacing.md }}>
      <Text style={styles.title}>Hub Évolution</Text>

      {/* Technical Ratings — Radar Chart */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notes Techniques</Text>
        <View style={styles.radarCard}>
          {Object.keys(ratings).length === 0 ? (
            <Text style={styles.emptyText}>Pas encore de notes techniques</Text>
          ) : (
            <>
              <View style={{ alignItems: 'center' }}>
                <RadarChart values={radarValues} />
              </View>
              {RATING_KEYS.map((key, i) => (
                <View key={key} style={styles.ratingRow}>
                  <Text style={styles.ratingLabel}>{key}</Text>
                  <View style={styles.ratingBar}>
                    <View style={[styles.ratingFill, { width: `${Math.min(radarValues[i], 100)}%` }]} />
                  </View>
                  <Text style={styles.ratingValue}>{radarValues[i]}</Text>
                </View>
              ))}
            </>
          )}
        </View>
      </View>

      {/* Stats */}
      {evo?.stats && Object.keys(evo.stats).length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statistiques</Text>
          <View style={styles.statsGrid}>
            <StatBox label="Buts" value={evo.stats.goals || 0} color={Colors.success} icon="football" />
            <StatBox label="Passes D." value={evo.stats.assists || 0} color={Colors.accent} icon="swap-horizontal" />
            <StatBox label="Matchs" value={evo.stats.matches_played || 0} color={Colors.primary} icon="trophy" />
            <StatBox label="Cartons J." value={evo.stats.yellow_cards || 0} color={Colors.warning} icon="card" />
          </View>
        </View>
      )}

      {/* Physical History */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Historique Physique</Text>
        {(evo?.physical_history || []).length === 0 ? (
          <Text style={styles.emptyText}>Aucune donnée physique enregistrée</Text>
        ) : (
          (evo?.physical_history || []).slice(-5).reverse().map((rec: any, i: number) => (
            <View key={i} style={styles.physCard}>
              <Text style={styles.physDate}>{rec.date ? new Date(rec.date).toLocaleDateString('fr-FR') : '-'}</Text>
              <View style={styles.physRow}>
                {rec.weight && <PhysStat label="Poids" value={`${rec.weight} kg`} />}
                {rec.height && <PhysStat label="Taille" value={`${rec.height} cm`} />}
                {rec.vma && <PhysStat label="VMA" value={`${rec.vma} km/h`} />}
              </View>
            </View>
          ))
        )}
      </View>

      {/* Evaluations */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Évaluations Coach</Text>
        {(evo?.evaluations || []).length === 0 ? (
          <Text style={styles.emptyText}>Aucune évaluation</Text>
        ) : (
          (evo?.evaluations || []).slice(-5).reverse().map((ev: any, i: number) => (
            <View key={i} style={styles.evalCard}>
              <View style={styles.evalHeader}>
                <Ionicons name="chatbox" size={18} color={Colors.primary} />
                <Text style={styles.evalDate}>{ev.date ? new Date(ev.date).toLocaleDateString('fr-FR') : '-'}</Text>
                {ev.rating && <Text style={styles.evalRating}>{ev.rating}/10</Text>}
              </View>
              <Text style={styles.evalComment}>{ev.comment}</Text>
            </View>
          ))
        )}
      </View>

      <View style={{ height: Spacing.xl }} />
    </ScrollView>
  );
}

function StatBox({ label, value, color, icon }: { label: string; value: number; color: string; icon: string }) {
  return (
    <View style={styles.statBox}>
      <Ionicons name={icon as any} size={22} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function PhysStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.physStat}>
      <Text style={styles.physStatValue}>{value}</Text>
      <Text style={styles.physStatLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: FontSizes.title, fontWeight: 'bold', color: Colors.text, marginBottom: Spacing.md },
  section: { marginBottom: Spacing.lg },
  sectionTitle: { fontSize: FontSizes.xl, fontWeight: 'bold', color: Colors.text, marginBottom: Spacing.sm },
  emptyText: { color: Colors.textSecondary, fontStyle: 'italic', padding: Spacing.md },
  radarCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  ratingLabel: { width: 40, fontSize: FontSizes.sm, fontWeight: '600', color: Colors.text },
  ratingBar: { flex: 1, height: 10, backgroundColor: Colors.border, borderRadius: 5, marginHorizontal: Spacing.sm, overflow: 'hidden' },
  ratingFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 5 },
  ratingValue: { width: 30, textAlign: 'right', fontSize: FontSizes.sm, fontWeight: 'bold', color: Colors.primary },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  statBox: {
    width: '48%', backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    padding: Spacing.md, alignItems: 'center', gap: Spacing.xs,
  },
  statValue: { fontSize: FontSizes.xxl, fontWeight: 'bold' },
  statLabel: { fontSize: FontSizes.sm, color: Colors.textSecondary },
  physCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.sm },
  physDate: { fontSize: FontSizes.sm, color: Colors.textSecondary, marginBottom: Spacing.xs },
  physRow: { flexDirection: 'row', gap: Spacing.md },
  physStat: { alignItems: 'center' },
  physStatValue: { fontSize: FontSizes.lg, fontWeight: 'bold', color: Colors.text },
  physStatLabel: { fontSize: FontSizes.xs, color: Colors.textSecondary },
  evalCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.sm },
  evalHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xs },
  evalDate: { flex: 1, fontSize: FontSizes.sm, color: Colors.textSecondary },
  evalRating: { fontSize: FontSizes.md, fontWeight: 'bold', color: Colors.primary },
  evalComment: { fontSize: FontSizes.md, color: Colors.text, lineHeight: 22 },
});
