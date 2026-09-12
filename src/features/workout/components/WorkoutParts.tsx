import type { PropsWithChildren } from 'react';
import { Text, View } from 'react-native';
import { QualityBar, QualityLegend, SetProgress, StatRow, StatTile } from '../../../components/display';
import { Card, styles } from '../../../components/ui';
import { borders, colors, radii, spacing, tones, typography, weight, type Tone } from '../../../theme/tokens';
import type { WorkoutScore } from '../scoring';
import { attemptQualityVisual, timerColor, type AttemptRating } from './workoutVisuals';

/** Figma S5 top bar: set step indicator on the left, match timer on the right. */
export function WorkoutHud({ setCount, currentSet, completedSets, secondsRemaining, phaseLabel, phaseTone }: { setCount: number; currentSet: number; completedSets: number; secondsRemaining: number | null; phaseLabel: string; phaseTone: Tone }) {
  return <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md }}>
    <View style={{ gap: spacing.xs, flexShrink: 1 }}>
      <SetProgress setCount={setCount} currentSet={currentSet} completedSets={completedSets} />
      <Text style={[typography.caption, { color: tones[phaseTone].text }]}>{phaseLabel}</Text>
    </View>
    {secondsRemaining !== null && <View accessible accessibilityLabel={`${secondsRemaining} seconds remaining`} style={{ alignItems: 'flex-end' }}>
      <Text style={[typography.number, { color: timerColor(secondsRemaining) }]}>{secondsRemaining}s</Text>
      <Text style={[typography.micro, { color: colors.textMuted }]}>Remaining</Text>
    </View>}
  </View>;
}

/** Rep chip plus colour-and-text feedback for the latest completed attempt. */
export function RepCounter({ reps, targetReps, lastRating, lastReason }: { reps: number; targetReps: number; lastRating: AttemptRating | undefined; lastReason: string | null }) {
  const visual = lastRating !== undefined ? attemptQualityVisual(lastRating) : null;
  return <View style={{ flexDirection: 'row', alignItems: 'stretch', gap: spacing.md }}>
    <View accessible accessibilityLabel={`${reps} of ${targetReps} reps`} style={{ backgroundColor: colors.bg, borderWidth: borders.default, borderColor: colors.border, borderRadius: radii.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={[typography.number, { color: colors.text }]}>{reps}<Text style={[typography.bodyLg, { color: colors.textMuted }]}>/{targetReps}</Text></Text>
      <Text style={[typography.micro, { color: colors.textMuted }]}>Reps</Text>
    </View>
    <View accessibilityLiveRegion="polite" style={{ flex: 1, borderRadius: radii.sm, borderWidth: borders.default, borderColor: visual?.color ?? colors.border, backgroundColor: colors.bg, padding: spacing.sm, justifyContent: 'center', gap: 2 }}>
      {visual ? <>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
          <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: visual.color }} />
          <Text style={[typography.bodyLg, { ...weight('900'), color: visual.textColor }]}>{visual.label}</Text>
          <Text style={[typography.caption, { color: colors.textMuted }]}>{visual.counted ? '· counted' : '· not counted'}</Text>
        </View>
        {lastReason && <Text numberOfLines={2} style={[typography.caption, { color: colors.textSecondary }]}>{lastReason}</Text>}
      </> : <Text style={[typography.caption, { color: colors.textMuted }]}>Complete a full side-view squat to receive an attempt result.</Text>}
    </View>
  </View>;
}

export function RestTimerCard({ nextSet, secondsLeft }: { nextSet: number; secondsLeft: number }) {
  return <Card tone="info" style={{ alignItems: 'center' }}>
    <Text style={[typography.label, { color: colors.accentDark }]}>REST BEFORE SET {nextSet}</Text>
    <Text accessibilityLiveRegion="polite" style={[typography.display, { color: colors.accent }]}>{secondsLeft}s</Text>
    <Text style={styles.body}>Next set in {secondsLeft}s</Text>
  </Card>;
}

/** Framed camera area (Figma: rounded, bordered) with the setup instruction above the preview. */
export function CameraFrame({ instruction, children }: PropsWithChildren<{ instruction: string }>) {
  return <View style={{ gap: spacing.sm }}>
    <Text style={[typography.label, { color: colors.textSecondary }]}>{instruction}</Text>
    <View style={{ borderRadius: radii.md + 2, borderWidth: 2.5, borderColor: colors.border, padding: spacing.xs, backgroundColor: colors.surface }}>{children}</View>
  </View>;
}

/** Score card for the local score (solo result, or challenge score before server submission). */
export function ScoreSummaryCard({ title, score, note }: { title: string; score: WorkoutScore; note: string }) {
  return <Card variant="plain">
    <Text style={[typography.bodyLg, { color: colors.text, ...weight('900'), textAlign: 'center' }]}>{title}</Text>
    <StatRow>
      <StatTile value={score.totalScore} label="Points" color={colors.currencyText} />
      <StatTile value={`${score.countedReps}/${score.cappedTargetReps}`} label="Counted reps" />
      <StatTile value={score.greenReps} label="Great reps" color={colors.primaryDark} />
    </StatRow>
    <QualityBar green={score.greenReps} yellow={score.yellowReps} red={score.redAttempts} neutral={score.neutralAttempts} />
    <QualityLegend green={score.greenReps} yellow={score.yellowReps} red={score.redAttempts} />
    <Text style={styles.caption}>{note}</Text>
  </Card>;
}
