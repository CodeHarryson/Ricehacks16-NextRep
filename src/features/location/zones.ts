import type { FeatureCollection, Point } from 'geojson';

export const DEMO_WORKOUT_ZONES: FeatureCollection<Point> = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', properties: { name: 'Gym', color: '#ff7a45' }, geometry: { type: 'Point', coordinates: [-95.3698, 29.7603] } },
    { type: 'Feature', properties: { name: 'Park', color: '#b44cff' }, geometry: { type: 'Point', coordinates: [-95.3712, 29.7594] } },
    { type: 'Feature', properties: { name: 'Walking trail', color: '#22d3ee' }, geometry: { type: 'Point', coordinates: [-95.3687, 29.7611] } },
  ],
};

export function isValidWorkoutZones(value: typeof DEMO_WORKOUT_ZONES): boolean {
  return value.type === 'FeatureCollection' && value.features.length === 3 && value.features.every((feature) => feature.geometry.type === 'Point' && feature.geometry.coordinates.length === 2);
}
