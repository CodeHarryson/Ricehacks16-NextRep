# Proximity challenges

Challenges are a demo-only handshake between two nearby presence records. The
server calculates proximity with PostGIS and returns only the approximate distance;
it never sends another user's raw coordinates to the mobile app.

The generated local `demo-*` identity is stored on-device and is not authentication
or production access control. Accepting a challenge only reaches the future workout
setup boundary. Shared workout configuration, battle scoring, rewards, and full
authentication are intentionally out of scope.
