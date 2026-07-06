/*
 * NullKey
 * Copyright (c) 2026 OptimaSeo
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, version 3.
 */

import { MessageForwarder } from '../forwarder';
import { RoomManager } from '../../rooms/manager';

jest.mock('../../config', () => ({
  config: { maxParticipantsPerRoom: 10, roomIdleTimeoutMinutes: 10 },
}));

describe('MessageForwarder', () => {
  let manager: RoomManager;
  let forwarder: MessageForwarder;

  beforeEach(() => {
    manager = new RoomManager();
    forwarder = new MessageForwarder(manager);
  });

  describe('forwardMessage', () => {
    it('calls broadcastToRoom on the manager', () => {
      const spy = jest.spyOn(manager, 'broadcastToRoom');
      const msg = { event: 'message:receive', payload: { room_id: 'r' } };
      const senderWs = { send: jest.fn() } as any;

      forwarder.forwardMessage('room-1', msg, senderWs);
      expect(spy).toHaveBeenCalledWith('room-1', msg, senderWs);
    });
  });

  describe('forwardMessageToClient', () => {
    it('sends message to the target client by fingerprint', () => {
      const sender = makeClient('ws-1', 'fp-sender');
      const target = makeClient('ws-2', 'fp-target');
      manager.addRoom('room-1');
      manager.addClientToRoom('room-1', sender);
      manager.addClientToRoom('room-1', target);

      const msg = { event: 'message:receive', payload: { room_id: 'r' } };
      const result = forwarder.forwardMessageToClient('room-1', msg, 'fp-target');
      expect(result).toBe(true);
      expect(target.ws.send).toHaveBeenCalledWith(JSON.stringify(msg));
    });

    it('returns false for unknown fingerprint', () => {
      manager.addRoom('room-1');
      manager.addClientToRoom('room-1', makeClient('ws-1', 'fp-1'));

      const result = forwarder.forwardMessageToClient('room-1', { event: 'test', payload: {} }, 'fp-unknown');
      expect(result).toBe(false);
    });
  });

  describe('canSendMessage', () => {
    it('returns false when 0 or 1 clients in room', () => {
      manager.addRoom('room-1');
      expect(forwarder.canSendMessage('room-1')).toBe(false);

      manager.addClientToRoom('room-1', makeClient('ws-1', 'fp-1'));
      expect(forwarder.canSendMessage('room-1')).toBe(false);
    });

    it('returns true when at least 2 clients', () => {
      manager.addRoom('room-1');
      manager.addClientToRoom('room-1', makeClient('ws-1', 'fp-1'));
      manager.addClientToRoom('room-1', makeClient('ws-2', 'fp-2'));
      expect(forwarder.canSendMessage('room-1')).toBe(true);
    });
  });
});

function makeClient(wsId: string, fingerprint?: string) {
  return {
    ws: { on: jest.fn(), send: jest.fn(), close: jest.fn(), readyState: 1, OPEN: 1 } as any,
    roomId: undefined,
    fingerprint,
    username: undefined,
    ip: undefined,
  };
}
