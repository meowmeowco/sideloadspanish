# Sync Worker

Privacy-first sync backend for the Sideload Spanish browser extension.

## Prerequisites

- `npm install`
- `spin` installed locally

## Commands

```bash
npm run build
npm test
npm run test:integration
npm run test:all
```

- `npm test` runs the hermetic unit suite only.
- `npm run test:integration` starts the worker with `spin up` and exercises the HTTP API on `127.0.0.1:3457`.
- `npm run test:all` runs both suites.

## Running Locally

Set the required webhook secret, then start Spin:

```bash
export SPIN_VARIABLE_LEMON_WEBHOOK_SECRET=dev-secret
spin up --listen 127.0.0.1:3457
```

Useful endpoints during local development:

- `GET /sync`
- `PUT /sync`
- `POST /validate`
- `POST /claim`
- `POST /recover`
- `POST /rotate`
- `POST /webhook`
- `POST /admin/create-key`

## Notes

Integration tests require a machine that can bind local ports. If `spin` is missing or local server startup is blocked by the environment, `npm run test:integration` will fail before any API assertions run.
