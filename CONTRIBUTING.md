# Contributing to NullKey

## Prerequisites

- Node.js 20+
- npm 9+

## Setup

```bash
git clone https://github.com/your-org/nullkey.git
cd nullkey

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

## Development

```bash
# Backend (http://localhost:8080)
cd backend
npm run dev

# Frontend (http://localhost:3000)
cd frontend
npm run dev
```

Open two browser tabs at `http://localhost:3000`. Create a room in one, join with the secret in the other.

## Code Style

- **TypeScript** — strict mode, no `any` in new code
- **Formatting** — Prettier (single quotes, trailing commas, 100 width)
- **Linting** — ESLint (run `npm run lint` before pushing)
- **Commits** — clear, concise messages in English

Run these before committing:

```bash
# Backend
cd backend
npm run lint
npm run format:check
npm test

# Frontend
cd frontend
npm run lint
npm run format:check
npm test
```

## Project Structure

```
backend/       WebSocket relay server
frontend/      Next.js client (static export)
docs/          Protocol spec, threat model, crypto design
```

See `README.md` in each package for internal architecture.

## Pull Requests

1. Fork the repo.
2. Create a branch: `git checkout -b feature/my-feature`.
3. Make your changes. Keep them focused — one PR per feature or fix.
4. Ensure all tests pass and lint is clean.
5. Open a PR against `main`. Include a clear description of what and why.

## License

By contributing, you agree that your contributions will be licensed under AGPL-3.0.
