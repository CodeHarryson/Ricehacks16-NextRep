import { StyleSheet, Text, View } from 'react-native';
import type { PoseFrame } from '../../contracts/pose';

const FACE_LANDMARKS: readonly number[] = [0, 2, 5, 7, 8];

interface Point { x: number; y: number; visible: boolean }

export function PoseOverlay({ frame, width, height, mirrored, visible }: {
  frame: PoseFrame | null;
  width: number;
  height: number;
  mirrored: boolean;
  visible: boolean;
}) {
  if (!visible || !frame || width <= 0 || height <= 0) return null;
  const scale = Math.min(width / frame.image.width, height / frame.image.height);
  const offsetX = (width - frame.image.width * scale) / 2;
  const offsetY = (height - frame.image.height * scale) / 2;
  const displayWidth = frame.image.width * scale;
  const displayHeight = frame.image.height * scale;
  const points = new Map<number, Point>();

  for (const landmark of frame.landmarks) {
    if (!FACE_LANDMARKS.includes(landmark.index)) continue;
    const imageX = landmark.x * frame.image.width * scale + offsetX;
    points.set(landmark.index, {
      x: mirrored ? width - imageX : imageX,
      y: landmark.y * frame.image.height * scale + offsetY,
      visible: (landmark.visibility ?? landmark.presence ?? 0) >= 0.5,
    });
  }

  return <View pointerEvents="none" style={StyleSheet.absoluteFill}>
    <View style={[overlayStyles.focusGuide, {
      left: offsetX + displayWidth * 0.23,
      top: offsetY + displayHeight * 0.08,
      width: displayWidth * 0.54,
      height: displayHeight * 0.38,
    }]} />
    <Text style={[overlayStyles.guideText, { top: Math.max(8, offsetY + 8) }]}>Center your face to start</Text>
    {FACE_LANDMARKS.map((index) => {
      const point = points.get(index);
      if (!point) return null;
      return <View key={index} style={[
        overlayStyles.dot,
        { left: point.x - 5, top: point.y - 5 },
        point.visible ? overlayStyles.visibleDot : overlayStyles.hiddenDot,
      ]} />;
    })}
  </View>;
}

const overlayStyles = StyleSheet.create({
  focusGuide: {
    position: 'absolute',
    borderColor: '#B5ED80', borderWidth: 3, borderRadius: 999,
  },
  guideText: {
    position: 'absolute', top: 8, alignSelf: 'center', color: '#FFFFFF',
    backgroundColor: 'rgba(0,0,0,0.58)', paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 8, fontSize: 11, fontWeight: '700',
  },
  dot: { position: 'absolute', width: 10, height: 10, borderRadius: 5, borderWidth: 1, borderColor: '#06110A' },
  visibleDot: { backgroundColor: '#39E06F' },
  hiddenDot: { backgroundColor: '#FF625F' },
});
