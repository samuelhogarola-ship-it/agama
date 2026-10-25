import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import {
  collectBranchWhatsappSnapshot,
  findLegacyCorporateMatches,
  isProtectedCorporateWhatsappFile,
  isProtectedCorporateWhatsappHub,
  isProtectedCorporateWhatsappMetadata,
} from './corporate-whatsapp-core.mjs';

const options = { root: fileURLToPath(new URL('../', import.meta.url)), mode: '--report', skipProtected: false, includeDist: false };
const args = process.argv.slice(2);
try {
  let modeSpecified = false;
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (['--report', '--assert-clean', '--write-branch-baseline'].includes(arg)) {
      if (modeSpecified) throw new Error('Choose exactly one validation mode.');
      options.mode = arg;
      modeSpecified = true;
    } else if (arg === '--skip-protected') options.skipProtected = true;
    else if (arg === '--include-dist') options.includeDist = true;
    else if (arg === '--root' && args[index + 1] && !args[index + 1].startsWith('--')) options.root = path.resolve(args[++index]);
    else throw new Error(`Unknown or incomplete argument: ${arg}`);
  }

  const baselinePath = path.join(options.root, 'data/corporate-whatsapp-branch-baseline.json');
  const snapshot = collectBranchWhatsappSnapshot(options.root);
  if (options.mode === '--write-branch-baseline') {
    fs.mkdirSync(path.dirname(baselinePath), { recursive: true });
    fs.writeFileSync(baselinePath, `${JSON.stringify(snapshot, null, 2)}\n`, { flag: 'wx' });
    console.log(`branch_baseline=written files=${Object.keys(snapshot).length}`);
  } else {
    const matches = findLegacyCorporateMatches(options.root, { includeDist: options.includeDist });
    const protectedMatches = matches.filter(({ file }) => isProtectedCorporateWhatsappFile(file));
    const hubMatches = matches.filter(({ file }) => isProtectedCorporateWhatsappHub(file));
    const metadataMatches = matches.filter(({ file }) => isProtectedCorporateWhatsappMetadata(file));
    const ordinaryMatches = matches.filter(({ file }) => !isProtectedCorporateWhatsappFile(file) && !isProtectedCorporateWhatsappHub(file) && !isProtectedCorporateWhatsappMetadata(file));
    console.log(`legacy_unprotected=${ordinaryMatches.length}`);
    console.log(`protected_skipped=${options.skipProtected ? new Set(protectedMatches.map(({ file }) => file.replace(/^dist\//, ''))).size : 0}`);
    console.log(`protected_hub_matches=${hubMatches.length}`);
    console.log(`protected_hubs_skipped=${options.skipProtected ? new Set(hubMatches.map(({ file }) => file.replace(/^dist\//, ''))).size : 0}`);
    for (const match of hubMatches) console.log(`protected_hub ${match.file}:${match.line} ${match.value}`);
    console.log(`protected_metadata_matches=${metadataMatches.length}`);
    console.log(`protected_metadata_skipped=${options.skipProtected ? new Set(metadataMatches.map(({ file }) => file)).size : 0}`);
    for (const match of metadataMatches) console.log(`protected_metadata ${match.file}:${match.line} ${match.value}`);
    console.log(`legacy_matches=${ordinaryMatches.length}`);
    for (const match of ordinaryMatches) console.log(`legacy ${match.file}:${match.line} ${match.value}`);
    console.log(`protected_legacy_matches=${protectedMatches.length}`);
    for (const match of protectedMatches) console.log(`protected ${match.file}:${match.line} ${match.value}`);
    const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
    const changedFiles = [...new Set([...Object.keys(baseline), ...Object.keys(snapshot)])]
      .filter((file) => !isDeepStrictEqual(baseline[file], snapshot[file]));
    const unchanged = changedFiles.length === 0;
    for (const file of changedFiles) console.error(`Branch WhatsApp baseline changed: ${file}`);
    console.log(`branch_baseline=${unchanged ? 'unchanged' : 'changed'}`);
    if (!unchanged || (options.mode === '--assert-clean' && (ordinaryMatches.length > 0 || (!options.skipProtected && (protectedMatches.length > 0 || hubMatches.length > 0 || metadataMatches.length > 0))))) process.exitCode = 1;
  }
} catch (error) {
  console.error(`CORPORATE WHATSAPP: ${error.message}`);
  process.exitCode = 1;
}
