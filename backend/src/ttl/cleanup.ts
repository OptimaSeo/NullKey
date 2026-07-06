/*
 * NullKey
 * Copyright (c) 2026 OptimaSeo
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, version 3.
 */

import { RoomManager } from '../rooms/manager';
import { config } from '../config';

export class CleanupService {
  private roomManager: RoomManager;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(roomManager: RoomManager) {
    this.roomManager = roomManager;
  }

  /**
   * Start the periodic cleanup process
   * @param intervalMs Interval in milliseconds between cleanup runs (default: from config)
   */
  startCleanup(intervalMs?: number): void {
    const interval = intervalMs ?? config.cleanupIntervalMs;

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    this.cleanupInterval = setInterval(() => {
      this.performCleanup();
    }, interval);

    console.log(`Cleanup service started with ${interval}ms interval`);
  }

  /**
   * Stop the periodic cleanup process
   */
  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      console.log('Cleanup service stopped');
    }
  }

  /**
   * Perform a single cleanup cycle
   */
  performCleanup(): void {
    console.log('Starting cleanup cycle...');
    
    // Clean up expired rooms
    this.roomManager.cleanupExpiredRooms();
    
    const remainingRooms = this.roomManager.getRoomCount();
    console.log(`Cleanup complete. Remaining rooms: ${remainingRooms}`);
  }

  /**
   * Force a cleanup regardless of timing
   */
  forceCleanup(): void {
    this.performCleanup();
  }
}