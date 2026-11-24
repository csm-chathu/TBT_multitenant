# Realtime (Pusher) — Quick Start

1) Install dependency:

```bash
npm install pusher
```

2) Environment variables (example):

```
PUSHER_APP_ID=your-app-id
PUSHER_KEY=your-key
PUSHER_SECRET=your-secret
PUSHER_CLUSTER=your-cluster
PUSHER_USE_TLS=true
PUSHER_AUTH_ENDPOINT=/realtime/auth
```

3) Auth endpoint (server):

- POST `/realtime/auth` with body `{ "socket_id":"...", "channel_name":"..." }`.
- Ensure the route validates the authenticated user before calling `PusherService.authenticate()`.

4) Example cURL — authenticate (private/presence):

```bash
curl -X POST http://localhost:3000/realtime/auth \
  -H "Content-Type: application/json" \
  -d '{"socket_id":"123.456","channel_name":"private-user-42"}'
```

5) Example cURL — trigger an event:

```bash
curl -X POST http://localhost:3000/realtime/notify \
  -H "Content-Type: application/json" \
  -d '{"channel":"private-user-42","event":"ticket.created","data": {"id":123}}'
```

6) Frontend notes:
- Use the official Pusher JS client and supply the `PUSHER_KEY` and `cluster`.
- For private/presence channels request auth from the `PUSHER_AUTH_ENDPOINT` on your server.
