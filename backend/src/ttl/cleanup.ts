import { RoomManager } from '../rooms/manager';

export class CleanupService {
  private roomManager: RoomManager;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(roomManager: RoomManager) {
    this.roomManager = roomManager;
  }

  /**
   * Start the periodic cleanup process
   * @param intervalMs Interval in milliseconds between cleanup runs (default: 1 minute)
   */
  startCleanup(intervalMs: number = 60000): void {
    // Clear any existing interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // Set up new interval
    this.cleanupInterval = setInterval(() => {
      this.performCleanup();
    }, intervalMs);

    console.log(`Cleanup service started with ${intervalMs}ms interval`);
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