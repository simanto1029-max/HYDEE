// Simple, robust IndexedDB service for HYDEE Atelier
// Bypasses the 5MB browser localStorage quota so 15+ high-res products are never lost or truncated

const DB_NAME = 'hydee_atelier_db';
const DB_VERSION = 1;
const STORE_PRODUCTS = 'products';
const STORE_SETTINGS = 'settings';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported in this environment'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_PRODUCTS)) {
        db.createObjectStore(STORE_PRODUCTS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
        db.createObjectStore(STORE_SETTINGS, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveAllProductsIDB(products: any[]): Promise<boolean> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction([STORE_PRODUCTS], 'readwrite');
      const store = tx.objectStore(STORE_PRODUCTS);
      
      // Clear old entries
      store.clear();

      // Put each product
      for (const prod of products) {
        store.put(prod);
      }

      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch (err) {
    console.warn('IndexedDB saveAllProducts error:', err);
    return false;
  }
}

export async function getAllProductsIDB(): Promise<any[]> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction([STORE_PRODUCTS], 'readonly');
      const store = tx.objectStore(STORE_PRODUCTS);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => resolve([]);
    });
  } catch (err) {
    console.warn('IndexedDB getAllProducts error:', err);
    return [];
  }
}

export async function saveSingleProductIDB(product: any): Promise<boolean> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction([STORE_PRODUCTS], 'readwrite');
      const store = tx.objectStore(STORE_PRODUCTS);
      store.put(product);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch (err) {
    return false;
  }
}

export async function deleteSingleProductIDB(id: string): Promise<boolean> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction([STORE_PRODUCTS], 'readwrite');
      const store = tx.objectStore(STORE_PRODUCTS);
      store.delete(id);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch (err) {
    return false;
  }
}
