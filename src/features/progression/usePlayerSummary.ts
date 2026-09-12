import { useEffect, useState } from 'react';
import { loadDemoUser } from '../location/identity';
import { loadPlayer, type PlayerState } from './storage';

export interface PlayerSummary { displayName: string | null; player: PlayerState | null; error: boolean; }

/** Read-only snapshot of the local identity and saved progression for HUD display. Never writes. */
export function usePlayerSummary(): PlayerSummary {
  const [summary, setSummary] = useState<PlayerSummary>({ displayName: null, player: null, error: false });
  useEffect(() => {
    let mounted = true;
    void Promise.all([loadDemoUser(), loadPlayer()])
      .then(([user, player]) => { if (mounted) setSummary({ displayName: user.displayName, player, error: false }); })
      .catch(() => { if (mounted) setSummary((current) => ({ ...current, error: true })); });
    return () => { mounted = false; };
  }, []);
  return summary;
}
