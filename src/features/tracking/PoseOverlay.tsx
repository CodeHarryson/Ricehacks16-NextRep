import { StyleSheet, Text, View } from 'react-native';
import type { PoseFrame } from '../../contracts/pose';
import { selectVisibleSide } from './poseAdapter';

const CONNECTIONS = [
  [11, 12], [11, 23], [12, 24], [23, 24],
  [23, 25], [25, 27], [24, 26], [26, 28],
] as const;
const DISPLAY_LANDMARKS: readonly number[] = [...new Set<number>(CONNECTIONS.flat())];
const LEFT = new Set([11, 23, 25, 27]);
const RIGHT = new Set([12, 24, 26, 28]);

interface Point { x: number; y: number; visible: boolean; selected: boolean }

export function PoseOverlay({ frame, width, height, mirrored }: {
  frame: PoseFrame | null;
  width: number;
  height: number;
  mirrored: boolean;
}) {
  if (!frame || width <= 0 || height <= 0) return null;
  const selectedSide = selectVisibleSide(frame, 0.5);
  const scale = Math.min(width / frame.image.width, height / frame.image.height);
  const offsetX = (width - frame.image.width * scale) / 2;
  const offsetY = (height - frame.image.height * scale) / 2;
  const displayWidth = frame.image.width * scale;
  const displayHeight = frame.image.height * scale;
  const points = new Map<number, Point>();

  for (const landmark of frame.landmarks) {
    if (!DISPLAY_LANDMARKS.includes(landmark.index)) continue;
    const imageX = landmark.x * frame.image.width * scale + offsetX;
    points.set(landmark.index, {
      x: mirrored ? width - imageX : imageX,
      y: landmark.y * frame.image.height * scale + offsetY,
      visible: (landmark.visibility ?? landmark.presence ?? 0) >= 0.5,
      selected: selectedSide === 'left' ? LEFT.has(landmark.index) : selectedSide === 'right' ? RIGHT.has(landmark.index) : false,
    });
  }

  return <View pointerEvents="none" style={StyleSheet.absoluteFill}>
    <View style={[overlayStyles.focusGuide, {
      left: offsetX + 8, top: offsetY + 8, width: Math.max(0, displayWidth - 16), height: Math.max(0, displayHeight - 16),
    }]} />
    <Text style={[overlayStyles.guideText, { top: Math.max(8, offsetY + 8) }]}>Keep your full body inside the guide</Text>
    {CONNECTIONS.map(([from, to]) => {
      const a = points.get(from); const b = points.get(to);
      if (!a?.visible || !b?.visible) return null;
      const length = Math.hypot(b.x - a.x, b.y - a.y);
      const angle = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
      return <View key={`${from}-${to}`} style={[overlayStyles.line, {
        left: (a.x + b.x) / 2 - length / 2,
        top: (a.y + b.y) / 2 - 1.5,
        width: length,
        transform: [{ rotate: `${angle}deg` }],
      }]} />;
    })}
    {DISPLAY_LANDMARKS.map((index) => {
      const point = points.get(index);
      if (!point) return null;
      return <View key={index} style={[
        overlayStyles.dot,
        { left: point.x - 5, top: point.y - 5 },
        point.visible ? (point.selected ? overlayStyles.selectedDot : overlayStyles.visibleDot) : overlayStyles.hiddenDot,
      ]} />;
    })}
  </View>;
}

const overlayStyles = StyleSheet.create({
  focusGuide: {
    position: 'absolute',
    borderColor: 'rgba(255,255,255,0.65)', borderWidth: 1, borderRadius: 18,
  },
  guideText: {
    position: 'absolute', top: 8, alignSelf: 'center', color: '#FFFFFF',
    backgroundColor: 'rgba(0,0,0,0.58)', paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 8, fontSize: 11, fontWeight: '700',
  },
  line: { position: 'absolute', height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.9)' },
  dot: { position: 'absolute', width: 10, height: 10, borderRadius: 5, borderWidth: 1, borderColor: '#06110A' },
  selectedDot: { backgroundColor: '#39E06F' },
  visibleDot: { backgroundColor: '#FFFFFF' },
  hiddenDot: { backgroundColor: '#FF625F' },
});
