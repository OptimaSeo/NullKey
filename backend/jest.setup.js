/*
 * NullKey
 * Copyright (c) 2026 OptimaSeo
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, version 3.
 */

// Jest setup — plain JS, runs before transform pipeline.
// Set deterministic env vars before config is loaded.
process.env.REPLAY_PROTECTION_ENABLED = 'true';
process.env.MAX_PARTICIPANTS_PER_ROOM = '10';
process.env.MESSAGE_TTL_MINUTES = '5';
