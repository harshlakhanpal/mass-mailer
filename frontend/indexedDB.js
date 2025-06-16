const DB_NAME = 'MailEzDB';
const DB_VERSION = 1;
const TOKEN_STORE_NAME = 'auth';
const WINDOW_STORE_NAME = 'mailEzWindowData';

/**
 * Opens an IndexedDB database connection.
 * @returns {Promise<IDBDatabase>} A promise that resolves with the database object.
 */
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    // Handle database opening errors
    request.onerror = (event) => {
      console.error('IndexedDB open error:', event.target.error);
      reject(new Error('Failed to open IndexedDB'));
    };

    // Handle successful database opening
    request.onsuccess = (event) => {
      resolve(request.result);
    };

    // Handle database version changes or initial creation
    request.onupgradeneeded = (event) => {
      const db = event.target.result; // No 'as IDBDatabase' needed in JS
      // Create 'auth' object store if it doesn't exist
      if (!db.objectStoreNames.contains(TOKEN_STORE_NAME)) {
        db.createObjectStore(TOKEN_STORE_NAME, { keyPath: 'id' });
      }
      // Create 'mailEzWindowData' object store if it doesn't exist
      if (!db.objectStoreNames.contains(WINDOW_STORE_NAME)) {
        db.createObjectStore(WINDOW_STORE_NAME, { keyPath: 'key' });
      }
    };
  });
}

/**
 * Stores an authentication token in IndexedDB.
 * @param {string} token The authentication token to store.
 * @returns {Promise<void>} A promise that resolves when the token is successfully stored.
 */
export async function setAuthToken(token) {
  const db = await openDatabase();
  const transaction = db.transaction([TOKEN_STORE_NAME], 'readwrite');
  const store = transaction.objectStore(TOKEN_STORE_NAME);
  // Put the token with a fixed ID 'authToken'
  store.put({ id: 'authToken', value: token });

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = (event) => {
      console.error('authToken storage transaction error:', event.target.error);
      reject(new Error('Auth token storage failed'));
    };
  });
}

/**
 * Retrieves the authentication token from IndexedDB.
 * @returns {Promise<string | null>} A promise that resolves with the token or null if not found.
 */
export async function getAuthToken() {
  const db = await openDatabase();
  const transaction = db.transaction([TOKEN_STORE_NAME], 'readonly');
  const store = transaction.objectStore(TOKEN_STORE_NAME);
  const request = store.get('authToken'); // Get the token by its ID

  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      resolve(request.result ? request.result.value : null);
    };
    request.onerror = (event) => {
      console.error('AuthToken retrieval request error:', event.target.error);
      reject(new Error('Auth token retrieval failed'));
    };
  });
}

/**
 * Removes the authentication token from IndexedDB.
 * @returns {Promise<void>} A promise that resolves when the token is successfully removed.
 */
export async function removeAuthToken() {
  const db = await openDatabase();
  const transaction = db.transaction([TOKEN_STORE_NAME], 'readwrite');
  const store = transaction.objectStore(TOKEN_STORE_NAME);
  store.delete('authToken'); // Delete the token by its ID

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = (event) => {
      console.error('AuthToken removal transaction error:', event.target.error);
      reject(new Error('Auth token removal failed'));
    };
  });
}

/**
 * Stores the main window ID and popup tab ID in IndexedDB.
 * @param {number} windowId The ID of the main browser window.
 * @param {number} popupTabId The ID of the extension's popup tab.
 * @returns {Promise<void>} A promise that resolves when the data is stored.
 */
export async function setWindowData(windowId, popupTabId) {
  const db = await openDatabase();
  const transaction = db.transaction([WINDOW_STORE_NAME], 'readwrite');
  const store = transaction.objectStore(WINDOW_STORE_NAME);
  // Store windowId and popupTabId using specific keys
  store.put({ key: 'windowId', value: windowId });
  store.put({ key: 'popupTabId', value: popupTabId });

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = (event) => {
      console.error(
        'Window data storage transaction error:',
        event.target.error
      );
      reject(new Error('Failed to store window data in IndexedDB'));
    };
  });
}

/**
 * Retrieves the main window ID and popup tab ID from IndexedDB.
 * @returns {Promise<{ windowId?: number, popupTabId?: number }>} A promise that resolves with the window data.
 */
export async function getWindowData() {
  const db = await openDatabase();
  const transaction = db.transaction([WINDOW_STORE_NAME], 'readonly');
  const store = transaction.objectStore(WINDOW_STORE_NAME);

  // Request both windowId and popupTabId
  const windowIdRequest = store.get('windowId');
  const popupTabIdRequest = store.get('popupTabId');

  return new Promise((resolve, reject) => {
    const data = {}; // Initialize an empty object to hold the retrieved data

    let requestsCompleted = 0;
    const totalRequests = 2;

    const checkCompletion = () => {
      requestsCompleted++;
      if (requestsCompleted === totalRequests) {
        resolve(data);
      }
    };

    windowIdRequest.onsuccess = () => {
      if (windowIdRequest.result) {
        data.windowId = windowIdRequest.result.value;
      }
      checkCompletion();
    };

    popupTabIdRequest.onsuccess = () => {
      if (popupTabIdRequest.result) {
        data.popupTabId = popupTabIdRequest.result.value;
      }
      checkCompletion();
    };

    transaction.onerror = (event) => {
      console.error(
        'Window data retrieval transaction error:',
        event.target.error
      );
      reject(new Error('Failed to retrieve window data from IndexedDB'));
    };
    // If individual requests fail, they will also trigger the transaction's error handler
    windowIdRequest.onerror = (event) => {
      console.error('WindowId retrieval request error:', event.target.error);
      reject(new Error('Failed to retrieve window ID'));
    };
    popupTabIdRequest.onerror = (event) => {
      console.error('PopupTabId retrieval request error:', event.target.error);
      reject(new Error('Failed to retrieve popup tab ID'));
    };
  });
}

/**
 * Removes the main window ID and popup tab ID from IndexedDB.
 * @returns {Promise<void>} A promise that resolves when the data is successfully removed.
 */
export async function removeWindowData() {
  const db = await openDatabase();
  const transaction = db.transaction([WINDOW_STORE_NAME], 'readwrite');
  const store = transaction.objectStore(WINDOW_STORE_NAME);
  // Delete stored window IDs
  store.delete('windowId');
  store.delete('popupTabId');

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = (event) => {
      console.error(
        'Window data removal transaction error:',
        event.target.error
      );
      reject(new Error('Failed to remove window data from IndexedDB'));
    };
  });
}
