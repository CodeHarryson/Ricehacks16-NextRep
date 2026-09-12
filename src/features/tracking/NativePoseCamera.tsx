import { useEffect } from 'react';
import type { CameraDevice } from 'react-native-vision-camera';
import { Camera } from 'react-native-vision-camera';
import type { PoseFrame, TrackingUpdate } from '../../contracts/pose';
import { useNativePoseAdapter } from './nativePoseAdapter';

export function NativePoseCamera({ device, active, position, onFrame, onTracking, onInitialized, onError }: {
  device: CameraDevice;
  active: boolean;
  position: 'front' | 'back';
  onFrame: (frame: PoseFrame) => void;
  onTracking: (update: TrackingUpdate) => void;
  onInitialized: () => void;
  onError: (message: string) => void;
}) {
  const solution = useNativePoseAdapter({ active, selectedSide: 'unknown', onFrame, onTracking });

  useEffect(() => {
    solution.cameraDeviceChangeHandler(device);
    solution.resizeModeChangeHandler('cover');
  }, [device, solution]);

  return <Camera
    key={device.id}
    style={{ flex: 1 }}
    device={device}
    resizeMode="cover"
    pixelFormat="rgb"
    isActive={active}
    photo={false}
    video={false}
    audio={false}
    isMirrored={position === 'front'}
    frameProcessor={solution.frameProcessor}
    onLayout={solution.cameraViewLayoutChangeHandler}
    onOutputOrientationChanged={solution.cameraOrientationChangedHandler}
    onInitialized={onInitialized}
    onError={(error) => onError(`Camera unavailable: ${error.code}`)}
  />;
}
