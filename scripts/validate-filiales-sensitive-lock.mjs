import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  buildSensitiveSnapshot,
  canonicalJson,
  sha256,
  snapshotHash,
} from './filiales-sensitive-data-core.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const defaultRoot = path.resolve(scriptDir, '..');
const defaultLockPath = path.join(defaultRoot, 'data', 'filiales-sensitive-data.lock.json');

const EXPECTED_LOCK_FILE_SHA256 = '32e8edb89bee1d74c599dc3cdfd2afd31b12c230e65ddf02d066a29c018e9508';
const RENEWAL_PHRASE = 'OWNER_WRITTEN_APPROVAL_AND_PHOTO_PRESENT';

function fail(message) {
  console.error(`SENSITIVE DATA LOCK: ${message}`);
  process.exit(1);
}

function parseArgs(argv) {
  const options = {
    mode: 'validate',
    root: defaultRoot,
    lockPath: defaultLockPath,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--write-lock') options.mode = 'write';
    else if (arg === '--compare') options.mode = 'compare';
    else if (arg === '--verify-external') options.mode = 'verify-external';
    else if (arg === '--root') options.root = path.resolve(argv[++index]);
    else if (arg === '--lock') options.lockPath = path.resolve(argv[++index]);
    else fail(`Unknown argument: ${arg}`);
  }

  return options;
}

function readLock(lockPath) {
  if (!fs.existsSync(lockPath)) fail('Protected lock manifest is missing.');
  try {
    return JSON.parse(fs.readFileSync(lockPath, 'utf8'));
  } catch {
    fail('Protected lock manifest is not valid JSON.');
  }
}

function lockFileHash(lockPath) {
  return sha256(fs.readFileSync(lockPath));
}

function timingSafeEqual(left, right) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length
    && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function snapshotsMatch(left, right) {
  return timingSafeEqual(snapshotHash(left), snapshotHash(right));
}

function verifySnapshot(root, lock) {
  const actual = buildSensitiveSnapshot(root);
  if (!snapshotsMatch(actual, lock.snapshot)) {
    fail(
      'PROHIBIDO: banking, tax, address, Maps, telephone, WhatsApp, or email data changed. '
      + 'A written owner authorization and a photo are required before renewing this lock.'
    );
  }
}

function validateLocal(options) {
  const lock = readLock(options.lockPath);
  const actualLockHash = lockFileHash(options.lockPath);
  if (!timingSafeEqual(actualLockHash, EXPECTED_LOCK_FILE_SHA256)) {
    fail(
      'The immutable lock manifest was altered. '
      + 'Do not update it without written owner authorization and photo evidence.'
    );
  }
  verifySnapshot(options.root, lock);
  console.log('Sensitive filial data lock OK.');
}

function compare(options) {
  const lock = readLock(options.lockPath);
  const actual = buildSensitiveSnapshot(options.root);
  console.log(`changed=${snapshotsMatch(actual, lock.snapshot) ? 'false' : 'true'}`);
}

function verifyExternal(options) {
  const expectedHash = process.env.FILIALES_SENSITIVE_LOCK_SHA256 || '';
  if (!/^[a-f0-9]{64}$/.test(expectedHash)) {
    fail('The independent GitHub lock fingerprint is missing.');
  }

  const actualLockHash = lockFileHash(options.lockPath);
  if (!timingSafeEqual(actualLockHash, expectedHash)) {
    fail('The candidate lock does not match the owner-controlled GitHub fingerprint.');
  }

  const lock = readLock(options.lockPath);
  verifySnapshot(options.root, lock);
  console.log('Independent sensitive filial data lock OK.');
}

function writeLock(options) {
  if (process.env.AGAMA_SENSITIVE_DATA_RENEWAL !== RENEWAL_PHRASE) {
    fail('Lock renewal requires the explicit owner-approval phrase.');
  }

  const evidenceHash = process.env.AGAMA_SENSITIVE_DATA_EVIDENCE_SHA256 || '';
  const authorization = process.env.AGAMA_SENSITIVE_DATA_AUTHORIZATION || '';
  if (!/^[a-f0-9]{64}$/.test(evidenceHash)) {
    fail('Lock renewal requires the SHA-256 fingerprint of the approval photo.');
  }
  if (authorization.trim().length < 20) {
    fail('Lock renewal requires the owner written authorization.');
  }

  const lock = {
    policy_version: 1,
    renewed_at: new Date().toISOString(),
    approval: {
      evidence_sha256: evidenceHash,
      written_authorization_sha256: sha256(authorization.trim()),
    },
    snapshot: buildSensitiveSnapshot(options.root),
  };

  fs.mkdirSync(path.dirname(options.lockPath), { recursive: true });
  fs.writeFileSync(options.lockPath, canonicalJson(lock), 'utf8');
  console.log(`lock_sha256=${lockFileHash(options.lockPath)}`);
}

const options = parseArgs(process.argv.slice(2));
if (options.mode === 'write') writeLock(options);
else if (options.mode === 'compare') compare(options);
else if (options.mode === 'verify-external') verifyExternal(options);
else validateLocal(options);
