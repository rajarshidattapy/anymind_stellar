/**
 * Client-side storage utility with error handling
 * Uses localStorage for browser storage
 */
export const storage = {
  /**
   * Get a value from localStorage
   * @param key Storage key
   * @param defaultValue Default value if key doesn't exist or error occurs
   * @returns Parsed value or default
   */
  get: <T>(key: string, defaultValue: T): T => {
    try {
      if (typeof window === 'undefined') {
        return defaultValue;
      }
      const item = localStorage.getItem(key);
      if (item === null) {
        return defaultValue;
      }
      return JSON.parse(item) as T;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return defaultValue;
    }
  },

  /**
   * Set a value in localStorage
   * @param key Storage key
   * @param value Value to store (will be JSON stringified)
   */
  set: <T>(key: string, value: T): void => {
    try {
      if (typeof window === 'undefined') {
        return;
      }
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
      // Handle quota exceeded error
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.warn('localStorage quota exceeded. Clearing old data...');
        // Could implement LRU eviction here if needed
      }
    }
  },

  /**
   * Remove a value from localStorage
   * @param key Storage key to remove
   */
  remove: (key: string): void => {
    try {
      if (typeof window === 'undefined') {
        return;
      }
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  },

  /**
   * Clear all localStorage (use with caution)
   */
  clear: (): void => {
    try {
      if (typeof window === 'undefined') {
        return;
      }
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  },

  /**
   * Check if localStorage is available
   */
  isAvailable: (): boolean => {
    try {
      if (typeof window === 'undefined') {
        return false;
      }
      const test = '__localStorage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }
};

/**
 * Storage keys used throughout the application
 */
export const STORAGE_KEYS = {
  ACTIVE_TAB: 'solmind_activeTab',
  ACTIVE_SUB_TAB: 'solmind_activeSubTab',
  ACTIVE_VIEW: 'solmind_activeView',
  SELECTED_CHAT_ID: 'solmind_selectedChatId',
  USER_PREFERENCES: 'solmind_userPreferences',
} as const;

