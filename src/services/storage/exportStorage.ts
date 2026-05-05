import * as FileSystem from 'expo-file-system';
import { documentDirectory, writeAsStringAsync } from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import type { Todo } from '../../types/todo';
import { logger } from '../../lib/logger';

export const exportStorage = {
  async exportData(todos: Todo[], directoryUri?: string): Promise<boolean> {
    try {
      const exportData = {
        todos,
        exportedAt: new Date().toISOString(),
        version: '1.0',
      };

      const content = JSON.stringify(exportData, null, 2);
      const filename = `todos-export-${new Date().toISOString().split('T')[0]}.json`;

      if (directoryUri && Platform.OS === 'android') {
        const SAF = (FileSystem as any).StorageAccessFramework;
        const fileUri = await SAF.createFileAsync(directoryUri, filename, 'application/json');
        await writeAsStringAsync(fileUri, content);
      } else {
        const fileUri = (documentDirectory || '') + filename;
        await writeAsStringAsync(fileUri, content);

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'application/json',
            dialogTitle: 'Export Todos Data',
          });
        }
      }

      return true;
    } catch (error) {
      logger.error('Export error:', error);
      return false;
    }
  },
};
