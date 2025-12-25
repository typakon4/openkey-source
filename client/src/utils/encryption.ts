// Web Crypto API helpers

interface EncryptedPayload {
  key_id: string; // Date string YYYY-MM-DD
  nonce: string;  // Base64 encoded IV
  ciphertext: string; // Base64 encoded data
}

interface KeyStorage {
  [date: string]: JsonWebKey;
}

const KEYS_STORAGE_KEY = 'openkey_secure_storage_keys';

// --- UTILS ---

const bufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

const base64ToBuffer = (base64: string): ArrayBuffer => {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

// --- KEY MANAGEMENT ---

const getTodayDateString = (): string => {
  return new Date().toISOString().split('T')[0];
};

const loadKeys = (): KeyStorage => {
  const stored = localStorage.getItem(KEYS_STORAGE_KEY);
  return stored ? JSON.parse(stored) : {};
};

const saveKey = (date: string, keyData: JsonWebKey) => {
  const keys = loadKeys();
  keys[date] = keyData;
  localStorage.setItem(KEYS_STORAGE_KEY, JSON.stringify(keys));
};

const getDailyKey = async (dateStr: string): Promise<CryptoKey> => {
  const keys = loadKeys();
  let keyData = keys[dateStr];

  if (!keyData) {
    // If requesting today's key and it doesn't exist, generate it.
    // If requesting an OLD key that doesn't exist, we can't decrypt (keys lost/deleted).
    if (dateStr === getTodayDateString()) {
      console.log(`[Crypto] Generating new key for ${dateStr}`);
      const newKey = await window.crypto.subtle.generateKey(
        {
          name: 'AES-GCM',
          length: 256,
        },
        true,
        ['encrypt', 'decrypt']
      );
      
      keyData = await window.crypto.subtle.exportKey('jwk', newKey);
      saveKey(dateStr, keyData);
      return newKey;
    } else {
      throw new Error(`Key for date ${dateStr} not found. Message cannot be decrypted.`);
    }
  }

  return await window.crypto.subtle.importKey(
    'jwk',
    keyData,
    { name: 'AES-GCM' },
    true,
    ['encrypt', 'decrypt']
  );
};

// --- MAIN FUNCTIONS ---

export const encryptMessage = async (text: string): Promise<string> => {
  try {
    const dateStr = getTodayDateString();
    const key = await getDailyKey(dateStr);
    const nonce = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for AES-GCM
    const encodedText = new TextEncoder().encode(text);

    const encryptedBuffer = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: nonce,
      },
      key,
      encodedText
    );

    const payload: EncryptedPayload = {
      key_id: dateStr,
      nonce: bufferToBase64(nonce.buffer),
      ciphertext: bufferToBase64(encryptedBuffer),
    };

    return JSON.stringify(payload);
  } catch (e) {
    console.error('Encryption failed', e);
    return text; // Fallback to plain text if critical failure (in dev)
  }
};

export const decryptMessage = async (storedString: string): Promise<string> => {
  try {
    // Check if it looks like our JSON format
    if (!storedString.startsWith('{') || !storedString.includes('"ciphertext"')) {
      return storedString; // Return as is (legacy plain text)
    }

    const payload: EncryptedPayload = JSON.parse(storedString);
    
    if (!payload.key_id || !payload.nonce || !payload.ciphertext) {
      return storedString;
    }

    const key = await getDailyKey(payload.key_id);
    const nonce = base64ToBuffer(payload.nonce);
    const ciphertext = base64ToBuffer(payload.ciphertext);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: nonce,
      },
      key,
      ciphertext
    );

    return new TextDecoder().decode(decryptedBuffer);
  } catch (e) {
    console.warn('[Crypto] Decryption failed or key missing:', e);
    return '🔒 Сообщение недоступно (ключ утерян)';
  }
};

// --- DEBUG HELPERS ---
export const getDebugInfo = () => {
  const keys = loadKeys();
  const today = getTodayDateString();
  return {
    currentKeyId: today,
    keyExistsForToday: !!keys[today],
    totalKeys: Object.keys(keys).length,
    keys: Object.keys(keys)
  };
};