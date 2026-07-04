// Jest setup — plain JS, runs before transform pipeline.
// Set deterministic env vars before config is loaded.
process.env.REPLAY_PROTECTION_ENABLED = 'true';
process.env.MAX_PARTICIPANTS_PER_ROOM = '10';
process.env.MESSAGE_TTL_MINUTES = '5';
