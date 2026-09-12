import { useCallback, useEffect, useRef, useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { StyleSheet, View } from 'react-native';
import type { CameraDevice } from 'react-native-vision-camera';
import { Camera } from 'react-native-vision-camera';
import type { PoseFrame, TrackingUpdate } from '../../contracts/pose';
import { useNativePoseAdapter } from './nativePoseAdapter';
import { PoseOverlay } from './PoseOverlay';

export function NativePoseCamera({ device, active, position, faceStartActive, onFrame, onTracking, onPreviewStarted, onError }: {
  device: CameraDevice;
  active: boolean;
  position: 'front' | 'back';
  faceStartActive: boolean;
  onFrame: (frame: PoseFrame) => void;
  onTracking: (update: TrackingUpdate) => void;
  onPreviewStarted: () => void;
  onError: (message: string) => void;
}) {
  const [overlayFrame, setOverlayFrame] = useState<PoseFrame | null>(null);
  const [layout, setLayout] = useState({ width: 0, height: 0 });
  const lastOverlayTimestamp = useRef(-Infinity);
  const handleFrame = useCallback((frame: PoseFrame) => {
    onFrame(frame);
    if (frame.timestamp - lastOverlayTimestamp.current >= 100) {
      lastOverlayTimestamp.current = frame.timestamp;
      setOverlayFrame(frame);
    }
  }, [onFrame]);
  const handleTracking = useCallback((update: TrackingUpdate) => {
    if (update.status !== 'tracking') setOverlayFrame(null);
    onTracking(update);
  }, [onTracking]);
  const solution = useNativePoseAdapter({ active, selectedSide: 'unknown', onFrame: handleFrame, onTracking: handleTracking });

  useEffect(() => {
    solution.cameraDeviceChangeHandler(device);
    solution.resizeModeChangeHandler('contain');
  }, [device, solution]);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    setLayout(event.nativeEvent.layout);
    solution.cameraViewLayoutChangeHandler(event);
  }, [solution]);

  return <View style={cameraStyles.root}>
    <Camera
    key={device.id}
    style={StyleSheet.absoluteFill}
    device={device}
    resizeMode="contain"
    androidPreviewViewType="texture-view"
    pixelFormat="rgb"
    isActive={active}
    photo={false}
    video={false}
    audio={false}
    isMirrored={position === 'front'}
    frameProcessor={solution.frameProcessor}
    onLayout={handleLayout}
    onOutputOrientationChanged={solution.cameraOrientationChangedHandler}
    onPreviewStarted={onPreviewStarted}
    onError={(error) => onError(`Camera unavailable: ${error.code} — ${error.message}`)}
    />
    <PoseOverlay frame={overlayFrame} width={layout.width} height={layout.height} mirrored={false} visible={faceStartActive} />
  </View>;
}

const cameraStyles = StyleSheet.create({ root: { flex: 1 } });
