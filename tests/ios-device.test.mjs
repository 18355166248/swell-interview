import { test } from 'node:test';
import assert from 'node:assert/strict';
import { selectDevice } from '../scripts/ios-device-run.mjs';
const phone = { name: 'Swell5', identifier: 'target-id', simulator: false, available: true, platform: 'com.apple.platform.iphoneos' };
test('指定 Swell5 时不能误装到其他设备或模拟器', () => {
  const other = { ...phone, name: 'Other', identifier: 'other-id' };
  assert.equal(selectDevice([other, phone], 'swell5'), phone);
  assert.throws(() => selectDevice([other], 'Swell5'));
  assert.throws(() => selectDevice([{ ...phone, simulator: true }], 'Swell5'));
  assert.throws(() => selectDevice([{ ...phone, available: false }], 'Swell5'));
  assert.throws(() => selectDevice([phone, { ...other, name: 'Swell5' }], 'Swell5'));
});
