export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error';

export type SyncStatusListener = (
  status: SyncStatus,
  lastSyncTime: Date | null,
  pendingCount: number
) => void;

const listeners: SyncStatusListener[] = [];

export const syncStatusStore = {
  currentStatus: 'offline' as SyncStatus,
  lastSyncTime: null as Date | null,
  pendingCount: 0,

  subscribe(listener: SyncStatusListener) {
    listeners.push(listener);
    listener(this.currentStatus, this.lastSyncTime, this.pendingCount);
    return () => {
      const index = listeners.indexOf(listener);
      if (index >= 0) listeners.splice(index, 1);
    };
  },

  notify(status: SyncStatus, time?: Date | null, pendingCount?: number) {
    this.currentStatus = status;
    if (status === 'synced') {
      this.lastSyncTime = time || new Date();
      this.pendingCount = 0;
    }
    if (pendingCount !== undefined) {
      this.pendingCount = pendingCount;
    }
    listeners.forEach(listener =>
      listener(this.currentStatus, this.lastSyncTime, this.pendingCount)
    );
  },
};
