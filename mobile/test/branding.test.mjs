import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = path.join(import.meta.dirname, '..');

function filesUnder(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return filesUnder(full);
    return /\.(tsx|ts)$/.test(entry.name) ? [full] : [];
  });
}

test('primary screens do not show the previous product name', () => {
  const files = [
    ...filesUnder(path.join(root, 'src', 'app')),
    ...filesUnder(path.join(root, 'src', 'ui')),
    path.join(root, 'src', 'i18n', 'copy.ts'),
  ];
  const hits = files.filter(file => /kharcha/i.test(fs.readFileSync(file, 'utf8')));
  assert.deepEqual(hits.map(file => path.relative(root, file)), []);
});

test('the active application id and native module are Cashweft', () => {
  const app = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8'));
  assert.equal(app.expo.name, 'Cashweft');
  assert.equal(app.expo.android.package, 'app.cashweft.mobile');
  assert.equal(app.expo.ios.bundleIdentifier, 'app.cashweft.mobile');
  assert.equal(app.expo.scheme, 'cashweft');
  const moduleConfig = JSON.parse(fs.readFileSync(path.join(root, 'modules', 'cashweft-sms', 'expo-module.config.json'), 'utf8'));
  assert.deepEqual(moduleConfig.android.modules, ['app.cashweft.sms.CashweftSmsModule']);
  assert.equal(fs.existsSync(path.join(root, 'modules', 'kharcha-sms', 'expo-module.config.json')), false);
});
