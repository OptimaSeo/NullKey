import { RoomModel } from '../room';

jest.mock('../../config', () => ({
  config: {
    maxParticipantsPerRoom: 10,
    roomIdleTimeoutMinutes: 10,
  },
}));

describe('RoomModel', () => {
  let room: RoomModel;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(1000);
    room = new RoomModel('room-1');
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('constructor', () => {
    it('creates a room with the given id', () => {
      expect(room.id).toBe('room-1');
      expect(room.createdAt).toBe(1000);
      expect(room.lastActivity).toBe(1000);
      expect(room.clients).toEqual([]);
    });

    it('accepts custom maxParticipants', () => {
      const r = new RoomModel('room-2', 3);
      expect(r['maxParticipants']).toBe(3);
    });

    it('uses config default when maxParticipants not given', () => {
      expect(room['maxParticipants']).toBe(10);
    });
  });

  describe('addClient', () => {
    it('adds a client successfully', () => {
      const client = makeClient('ws-1');
      expect(room.addClient(client)).toBe(true);
      expect(room.clients).toHaveLength(1);
      expect(room.clients[0]).toBe(client);
    });

    it('rejects duplicate client (same ws)', () => {
      const client = makeClient('ws-1');
      room.addClient(client);
      expect(room.addClient(client)).toBe(false);
      expect(room.clients).toHaveLength(1);
    });

    it('rejects when room is full', () => {
      const r = new RoomModel('room-3', 2);
      expect(r.addClient(makeClient('ws-1'))).toBe(true);
      expect(r.addClient(makeClient('ws-2'))).toBe(true);
      expect(r.addClient(makeClient('ws-3'))).toBe(false);
      expect(r.clients).toHaveLength(2);
    });

    it('updates lastActivity on add', () => {
      jest.setSystemTime(2000);
      room.addClient(makeClient('ws-1'));
      expect(room.lastActivity).toBe(2000);
    });
  });

  describe('removeClient', () => {
    it('removes an existing client', () => {
      const c1 = makeClient('ws-1');
      const c2 = makeClient('ws-2');
      room.addClient(c1);
      room.addClient(c2);
      expect(room.removeClient(c1)).toBe(true);
      expect(room.clients).toHaveLength(1);
      expect(room.clients[0]).toBe(c2);
    });

    it('returns false when client not found', () => {
      expect(room.removeClient(makeClient('ws-99'))).toBe(false);
    });

    it('updates lastActivity on remove', () => {
      const client = makeClient('ws-1');
      room.addClient(client);
      jest.setSystemTime(3000);
      room.removeClient(client);
      expect(room.lastActivity).toBe(3000);
    });
  });

  describe('getClientCount / isEmpty', () => {
    it('returns 0 and true for a new room', () => {
      expect(room.getClientCount()).toBe(0);
      expect(room.isEmpty()).toBe(true);
    });

    it('returns correct count after adding clients', () => {
      room.addClient(makeClient('ws-1'));
      room.addClient(makeClient('ws-2'));
      expect(room.getClientCount()).toBe(2);
      expect(room.isEmpty()).toBe(false);
    });
  });

  describe('isExpired', () => {
    it('returns false when lastActivity is recent', () => {
      jest.setSystemTime(1000);
      expect(room.isExpired(10000)).toBe(false);
    });

    it('returns true when idle time exceeds maxIdleTime', () => {
      jest.setSystemTime(1000);
      room.addClient(makeClient('ws-1'));
      jest.setSystemTime(20000);
      expect(room.isExpired(10000)).toBe(true);
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
