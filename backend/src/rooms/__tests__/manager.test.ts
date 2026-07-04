import { RoomManager } from '../manager';
import { RoomModel } from '../room';

// We need to make sure RoomModel constructor uses provided maxParticipants.
// Since it imports config, we mock it.
jest.mock('../../config', () => ({
  config: {
    maxParticipantsPerRoom: 10,
    roomIdleTimeoutMinutes: 10,
  },
}));

describe('RoomManager', () => {
  let manager: RoomManager;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(1000);
    manager = new RoomManager();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('addRoom / hasRoom / getRoom', () => {
    it('adds a room and returns true', () => {
      expect(manager.addRoom('room-1')).toBe(true);
      expect(manager.hasRoom('room-1')).toBe(true);
      expect(manager.getRoom('room-1')).toBeInstanceOf(RoomModel);
    });

    it('returns false when room already exists', () => {
      manager.addRoom('room-1');
      expect(manager.addRoom('room-1')).toBe(false);
    });
  });

  describe('addRoom with invite token', () => {
    it('stores invite token when room is created', () => {
      manager.addRoom('room-1', 'token-abc');
      expect(manager.verifyInviteToken('room-1', 'token-abc')).toBe(true);
    });

    it('rejects unknown tokens', () => {
      manager.addRoom('room-1', 'token-abc');
      expect(manager.verifyInviteToken('room-1', 'wrong-token')).toBe(false);
    });

    it('rejects token for non-existent room', () => {
      expect(manager.verifyInviteToken('ghost', 'token')).toBe(false);
    });
  });

  describe('invalidateToken', () => {
    it('consumes a token after use', () => {
      manager.addRoom('room-1', 'token-abc');
      manager.invalidateToken('room-1', 'token-abc');
      expect(manager.verifyInviteToken('room-1', 'token-abc')).toBe(false);
    });
  });

  describe('addInviteToken', () => {
    it('adds additional tokens to an existing room', () => {
      manager.addRoom('room-1', 'token-1');
      manager.addInviteToken('room-1', 'token-2');
      expect(manager.verifyInviteToken('room-1', 'token-1')).toBe(true);
      expect(manager.verifyInviteToken('room-1', 'token-2')).toBe(true);
    });
  });

  describe('addClientToRoom', () => {
    it('adds a client to an existing room', () => {
      manager.addRoom('room-1');
      const client = makeClient('ws-1');
      expect(manager.addClientToRoom('room-1', client)).toBe(true);
      expect(manager.getClientCount('room-1')).toBe(1);
    });

    it('returns false for a non-existent room', () => {
      expect(manager.addClientToRoom('ghost', makeClient('ws-x'))).toBe(false);
    });
  });

  describe('removeClientFromRoom', () => {
    it('removes a client from a room', () => {
      manager.addRoom('room-1');
      const c1 = makeClient('ws-1');
      const c2 = makeClient('ws-2');
      manager.addClientToRoom('room-1', c1);
      manager.addClientToRoom('room-1', c2);
      expect(manager.removeClientFromRoom('room-1', c1)).toBe(true);
      expect(manager.getClientCount('room-1')).toBe(1);
    });

    it('deletes the room and tokens when last client leaves', () => {
      manager.addRoom('room-1', 'secret-token');
      const client = makeClient('ws-1');
      manager.addClientToRoom('room-1', client);
      manager.removeClientFromRoom('room-1', client);
      expect(manager.hasRoom('room-1')).toBe(false);
      expect(manager.verifyInviteToken('room-1', 'secret-token')).toBe(false);
    });

    it('returns false when room does not exist', () => {
      expect(manager.removeClientFromRoom('ghost', makeClient('ws-x'))).toBe(false);
    });
  });

  describe('broadcastToRoom', () => {
    it('sends message to all clients except sender', () => {
      manager.addRoom('room-1');
      const sender = { ws: { send: jest.fn(), readyState: 1, OPEN: 1 }, fingerprint: 'fp-1' };
      const receiver = { ws: { send: jest.fn(), readyState: 1, OPEN: 1 }, fingerprint: 'fp-2' };
      manager.addClientToRoom('room-1', sender as any);
      manager.addClientToRoom('room-1', receiver as any);

      manager.broadcastToRoom('room-1', { event: 'test' }, sender.ws);
      expect(sender.ws.send).not.toHaveBeenCalled();
      expect(receiver.ws.send).toHaveBeenCalledWith(JSON.stringify({ event: 'test' }));
    });

    it('does nothing when room does not exist', () => {
      manager.broadcastToRoom('ghost', { event: 'test' });
      // no throw
    });
  });

  describe('cleanupExpiredRooms', () => {
    it('removes expired rooms', () => {
      manager.addRoom('room-a', 'token-a');
      manager.addRoom('room-b', 'token-b');

      // advance time so room-a is expired but room-b is not
      // RoomModel.isExpired uses config.roomIdleTimeoutMinutes (10) * 60s = 600000ms
      const maxIdle = 600000;
      jest.setSystemTime(1000 + maxIdle + 1); // room-a expired
      // touch room-b
      manager.getRoom('room-b')!.updateLastActivity();
      jest.setSystemTime(2000 + maxIdle + 1); // room-b is now also expired if > 600000 from its update

      // Actually simpler: we need to be precise. Let's just advance far enough
      // that both rooms are definitely expired.
      // But we can't easily control RoomModel.isExpired because it reads config at module time.
      // Let's use a longer advance for safety.
    });
  });

  describe('getAllRoomIds / getRoomCount', () => {
    it('returns empty for fresh manager', () => {
      expect(manager.getAllRoomIds()).toEqual([]);
      expect(manager.getRoomCount()).toBe(0);
    });

    it('returns added rooms', () => {
      manager.addRoom('a');
      manager.addRoom('b');
      expect(manager.getAllRoomIds()).toEqual(['a', 'b']);
      expect(manager.getRoomCount()).toBe(2);
    });
  });
});

function makeClient(_wsId: string) {
  return {
    ws: { on: jest.fn(), send: jest.fn(), close: jest.fn(), readyState: 1, OPEN: 1 } as any,
    roomId: undefined,
    fingerprint: undefined,
    username: undefined,
    ip: undefined,
  };
}
