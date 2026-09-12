# Location presence

The map is a demo-only nearby-presence surface. A generated `demo-*` user ID is
stored locally until authentication exists; it is not an identity system.

The client requests foreground location only while `MapScreen` is mounted. GPS
callbacks are gated to roughly 12-second intervals and 25 metres of movement,
then nearby users are polled every 15 seconds. Leaving the screen or selecting
“Stop sharing location” removes the watcher and expires the server presence.

The server owns the 250-metre radius, expiry, and distance calculation. It returns
coordinates quantized to four decimal places; exact coordinates of other users are
never sent to the app. Presence rows expire after 60 seconds and cleanup removes
expired rows. No background tracking, camera uploads, battle scoring, or matching
is implemented.
