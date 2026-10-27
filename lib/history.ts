export type HistoryRecord = {
  id: string;
  prompt: string;
  style: string;
  aspectRatio: string;
  width: number;
  height: number;
  createdAt: number;
  blob: Blob;
};

const DB_NAME = 'prismora-studio';
const STORE_NAME = 'generated-images';
const DB_VERSION = 1;

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('This browser does not support local image history.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Could not open image history.'));
  });
}

export async function saveHistoryRecord(record: HistoryRecord): Promise<void> {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).put(record);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('Could not save image history.'));
    transaction.onabort = () => reject(transaction.error ?? new Error('Image history save was cancelled.'));
  });
  database.close();
}

export async function readHistoryRecords(): Promise<HistoryRecord[]> {
  const database = await openDatabase();
  const records = await new Promise<HistoryRecord[]>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readonly');
    const request = transaction.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve((request.result as HistoryRecord[]).sort((a, b) => b.createdAt - a.createdAt));
    request.onerror = () => reject(request.error ?? new Error('Could not read image history.'));
  });
  database.close();
  return records;
}

export async function deleteHistoryRecord(id: string): Promise<void> {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).delete(id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('Could not delete this image.'));
  });
  database.close();
}

export async function clearHistoryRecords(): Promise<void> {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).clear();
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('Could not clear image history.'));
  });
  database.close();
}
