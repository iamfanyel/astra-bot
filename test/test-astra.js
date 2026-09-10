import { generateRoomCode, getRoomUrl, createAstraRoom, checkAstraRoom, closeAstraRoom } from '../src/services/astraApi.js';

async function runTests() {
  console.log('🧪 Starting Astra API & Integration Tests...\n');

  // Test 1: Code Generation
  const code = generateRoomCode();
  console.log(`[Test 1] Generated Room Code: "${code}"`);
  const pattern = /^[A-Z0-9]{6}$/;
  if (!pattern.test(code)) {
    throw new Error(`Code ${code} does not match expected 6-char pattern!`);
  }
  console.log('  ✅ Code format valid.\n');

  // Test 2: URL Generation
  const url = getRoomUrl(code);
  console.log(`[Test 2] Generated Room URL: "${url}"`);
  if (!url.startsWith('https://astrascreen.live/room/?room=')) {
    throw new Error(`Unexpected URL format: ${url}`);
  }
  console.log('  ✅ URL format valid.\n');

  // Test 3: Create Room via Astra API
  console.log(`[Test 3] Calling Astra API to create room "${code}"...`);
  const createResult = await createAstraRoom(code);
  console.log('  Result:', createResult);
  if (!createResult.success) {
    throw new Error('Room creation failed!');
  }
  console.log('  ✅ Astra room created & registered successfully.\n');

  // Test 4: Check Room Status
  console.log(`[Test 4] Querying Astra room status for "${code}"...`);
  const status = await checkAstraRoom(code);
  console.log('  Status:', status);
  if (!status.exists) {
    throw new Error(`Room ${code} was not found on Astra!`);
  }
  if (!status.needsHost) {
    console.warn('  ⚠️ Note: needsHost is false. Ensure empty action was applied.');
  } else {
    console.log('  ✅ Room status confirmed (needsHost: true for instant user claim).');
  }
  console.log('  ✅ Room status check passed.\n');

  // Test 5: Clean up / Close Room
  console.log(`[Test 5] Closing test room "${code}"...`);
  const closed = await closeAstraRoom(code);
  console.log('  Closed:', closed);
  console.log('  ✅ Room cleanup successful.\n');

  console.log('🎉 All Astra integration tests passed successfully!');
}

runTests().catch((err) => {
  console.error('\n❌ Test failed with error:', err);
  process.exit(1);
});
