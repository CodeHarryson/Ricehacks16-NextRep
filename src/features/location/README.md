# Location presence

The map is a demo-only nearby-presence surface rendered by one MapLibre native
map on iOS and Android with a hosted MapTiler style. A generated `demo-*` user ID
is stored locally until authentication exists; it is not an identity system.

When `__DEV__` is enabled, choose Test Player A on one device and Test Player B
on the other to publish deterministic nearby coordinates without simulator
location controls. Both devices must run the same bundle, use the same reachable
API base URL, and remain on the map screen. “Use real device GPS” restores normal
foreground location behavior.

The client requests foreground location only while `MapScreen` is mounted. GPS
callbacks are gated to roughly 12-second intervals and 25 metres of movement,
then nearby users are polled every 15 seconds. Leaving the screen or selecting
“Stop sharing location” removes the watcher and expires the server presence.

The server owns the 250-metre radius, expiry, and distance calculation. It returns
coordinates quantized to four decimal places; exact coordinates of other users are
never sent to the app. Presence rows expire after 60 seconds and cleanup removes
expired rows. The proximity challenge handshake, shared squat configuration, and
server-resolved battle scoring are implemented. There is no background tracking;
production authentication and advanced map data remain planned.
