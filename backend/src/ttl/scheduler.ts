/*
 * NullKey
 * Copyright (c) 2026 OptimaSeo
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, version 3.
 */

import { CleanupService } from './cleanup';

export class Scheduler {
  private cleanupService: CleanupService;
  private scheduledTasks: Map<string, NodeJS.Timeout>;

  constructor(cleanupService: CleanupService) {
    this.cleanupService = cleanupService;
    this.scheduledTasks = new Map();
  }

  /**
   * Schedule a one-time cleanup of a specific room after a delay
   * @param roomId The room ID to schedule for cleanup
   * @param delayMs Delay in milliseconds before cleanup
   */
  scheduleRoomCleanup(roomId: string, delayMs: number): void {
    // Note: In the current architecture, rooms are cleaned up by the periodic cleanup service
    // This method could be used to implement more granular scheduling if needed
    console.log(`Room ${roomId} cleanup scheduled in ${delayMs}ms (Note: Currently handled by periodic cleanup)`);
  }

  /**
   * Schedule a delayed message cleanup (for future enhancement)
   * @param messageId The message ID to schedule for cleanup
   * @param delayMs Delay in milliseconds before cleanup
   */
  scheduleMessageCleanup(messageId: string, delayMs: number): void {
    // In MVP, messages are kept in memory only and expire when room expires
    // This method is reserved for future enhancement if persistent storage is added
    console.log(`Message ${messageId} cleanup scheduled in ${delayMs}ms (Not implemented in MVP)`);
  }

  /**
   * Cancel a scheduled task
   * @param taskId The ID of the task to cancel
   */
  cancelScheduledTask(taskId: string): boolean {
    const task = this.scheduledTasks.get(taskId);
    if (task) {
      clearTimeout(task);
      this.scheduledTasks.delete(taskId);
      return true;
    }
    return false;
  }

  /**
   * Start the scheduler
   */
  start(): void {
    // Currently, the scheduler just manages the periodic cleanup service
    this.cleanupService.startCleanup();
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    this.cleanupService.stopCleanup();
    
    // Clear all scheduled tasks
    for (const [, task] of this.scheduledTasks) {
      clearTimeout(task);
    }
    this.scheduledTasks.clear();
  }
}