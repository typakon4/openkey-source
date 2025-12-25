import { encryptMessage, decryptMessage, getDebugInfo } from './encryption';

type TestResult = {
  name: string;
  passed: boolean;
  message?: string;
};

/**
 * Simple Test Runner for Browser Environment
 */
export const runEncryptionTests = async (): Promise<string> => {
  const results: TestResult[] = [];
  let logOutput = "🚀 ЗАПУСК МОДУЛЬНЫХ ТЕСТОВ...\n\n";

  const assert = (condition: boolean, name: string, errorMsg?: string) => {
    if (condition) {
      results.push({ name, passed: true });
    } else {
      results.push({ name, passed: false, message: errorMsg || 'Assertion failed' });
    }
  };

  try {
    // --- TEST 1: Basic Roundtrip ---
    {
      const original = "Hello OpenKey World 123";
      const encrypted = await encryptMessage(original);
      const decrypted = await decryptMessage(encrypted);
      
      assert(encrypted !== original, "Message is actually encrypted (not plain text)");
      assert(decrypted === original, "Decrypted text matches original");
      assert(encrypted.includes('"ciphertext"'), "Output format is JSON");
    }

    // --- TEST 2: UTF-8 & Emoji Support ---
    {
      const original = "Привет 🌍! Это тест UTF-8.";
      const encrypted = await encryptMessage(original);
      const decrypted = await decryptMessage(encrypted);
      assert(decrypted === original, "UTF-8/Emoji roundtrip successful");
    }

    // --- TEST 3: Nonce/IV Randomization ---
    {
      const original = "Secret";
      const enc1 = await encryptMessage(original);
      const enc2 = await encryptMessage(original);
      
      const obj1 = JSON.parse(enc1);
      const obj2 = JSON.parse(enc2);
      
      assert(obj1.ciphertext !== obj2.ciphertext, "Same text produces different ciphertext (IV used)");
      assert(obj1.nonce !== obj2.nonce, "Nonces are unique per encryption");
      assert(obj1.key_id === obj2.key_id, "Key ID remains constant for same day");
    }

    // --- TEST 4: Error Handling ---
    {
      const garbage = "This is not a JSON string";
      const result = await decryptMessage(garbage);
      assert(result === garbage, "Legacy/Garbage text returned as-is");
    }

    // --- TEST 5: Key Existence ---
    {
      const info = getDebugInfo();
      assert(info.keyExistsForToday, "Key for today exists in storage");
      assert(info.totalKeys > 0, "Key storage is not empty");
    }

  } catch (e: any) {
    logOutput += `❌ CRITICAL ERROR: ${e.message}\n`;
  }

  // Generate Report
  let passedCount = 0;
  results.forEach(r => {
    if (r.passed) {
      passedCount++;
      logOutput += `✅ [PASS] ${r.name}\n`;
    } else {
      logOutput += `❌ [FAIL] ${r.name} -> ${r.message}\n`;
    }
  });

  logOutput += `\n🏁 ИТОГ: ${passedCount}/${results.length} тестов пройдено.`;
  
  return logOutput;
};