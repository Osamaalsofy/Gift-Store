// Safe Storage Wrapper to prevent iframe/sandbox crashes with localStorage
function createSafeStorage() {
  let available = false;
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const testKey = "__storage_test__";
      window.localStorage.setItem(testKey, "1");
      window.localStorage.removeItem(testKey);
      available = true;
    }
  } catch (err) {
    available = false;
  }

  const memoryFallback = new Map<string, string>();

  return {
    getItem(key: string): string | null {
      try {
        if (available && typeof window !== "undefined" && window.localStorage) {
          return window.localStorage.getItem(key);
        }
      } catch (err) {
        // ignore and fallback
      }
      return memoryFallback.get(key) ?? null;
    },
    setItem(key: string, value: string): void {
      try {
        if (available && typeof window !== "undefined" && window.localStorage) {
          window.localStorage.setItem(key, value);
          return;
        }
      } catch (err) {
        // ignore and fallback
      }
      memoryFallback.set(key, value);
    },
    removeItem(key: string): void {
      try {
        if (available && typeof window !== "undefined" && window.localStorage) {
          window.localStorage.removeItem(key);
          return;
        }
      } catch (err) {
        // ignore
      }
      memoryFallback.delete(key);
    }
  };
}

export const safeStorage = createSafeStorage();
