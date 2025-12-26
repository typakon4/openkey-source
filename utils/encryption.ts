
// Access the globally loaded library (from index.html script tag)
const getCryptoJS = () => (window as any).CryptoJS;

const MASTER_KEY_STRING = 'OPENKEY_MASTER_SECRET_2024_DEMO_KEY_MUST_BE_32_BYTES!!'; 

// --- TEXT ENCRYPTION ---

export const encryptMessage = async (text: string): Promise<string> => {
    const CryptoJS = getCryptoJS();
    try {
        if (!CryptoJS) {
            console.warn("CryptoJS library not loaded, sending plaintext");
            return text;
        }
        // Encrypt directly to a string format
        const encrypted = CryptoJS.AES.encrypt(text, MASTER_KEY_STRING).toString();
        return encrypted;
    } catch (e) {
        console.error("Encryption failed", e);
        return text;
    }
};

export const decryptMessage = async (storedString: string): Promise<string> => {
    const CryptoJS = getCryptoJS();
    try {
        if (!storedString || !storedString.trim()) return '';
        if (!CryptoJS) return storedString;

        // Try to decrypt
        const bytes = CryptoJS.AES.decrypt(storedString, MASTER_KEY_STRING);
        const originalText = bytes.toString(CryptoJS.enc.Utf8);
        
        if (!originalText) {
            // Check if input looks like Base64 (CryptoJS output format)
            if (storedString.includes(' ') || !storedString.endsWith('=')) {
                 // Likely plain text
                 return storedString;
            }
            return "🔒 Ошибка расшифровки";
        }
        
        return originalText;
    } catch (e) {
        // If it fails, assume it was plain text
        return storedString;
    }
};

// --- FILE ENCRYPTION ---

export const encryptFile = async (file: File): Promise<Blob> => {
    const CryptoJS = getCryptoJS();
    return new Promise((resolve, reject) => {
        if (!CryptoJS) {
            reject(new Error("CryptoJS not loaded"));
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            try {
                const dataUrl = reader.result as string;
                // Encrypt the entire DataURL string
                const encrypted = CryptoJS.AES.encrypt(dataUrl, MASTER_KEY_STRING).toString();
                // Return as a simple Text Blob
                const blob = new Blob([encrypted], { type: 'text/plain' });
                resolve(blob);
            } catch (e) {
                reject(e);
            }
        };
        reader.onerror = (e) => reject(e);
        // Read as DataURL so we preserve mime type and data easily inside the encrypted string
        reader.readAsDataURL(file);
    });
};

export const decryptFile = async (encryptedBlob: Blob, originalType: string): Promise<Blob> => {
    const CryptoJS = getCryptoJS();
    if (!CryptoJS) throw new Error("CryptoJS not loaded");

    const text = (await encryptedBlob.text()).trim();
    
    // Decrypt ciphertext to DataURL string
    const bytes = CryptoJS.AES.decrypt(text, MASTER_KEY_STRING);
    const dataUrl = bytes.toString(CryptoJS.enc.Utf8);
    
    if (!dataUrl.startsWith('data:')) {
        throw new Error("Decryption failed or invalid format");
    }

    // Convert DataURL back to Blob
    const res = await fetch(dataUrl);
    return await res.blob();
};

export const getDebugInfo = () => {
    const CryptoJS = getCryptoJS();
    return {
        algorithm: 'AES-256',
        isWebCryptoSupported: false,
        masterKeyLength: MASTER_KEY_STRING.length,
        keyExistsForToday: true,
        totalKeys: 1,
        libraryLoaded: !!CryptoJS,
        note: 'Running in Compatibility Mode (HTTP Supported)'
    };
};
