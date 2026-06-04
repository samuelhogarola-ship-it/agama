import { spawnSync } from 'child_process';

const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function runStep(label, command, args, envOverrides = {}) {
  console.log(`\n== ${label} ==`);
  console.log(`$ ${command} ${args.join(' ')}`);

  const result = spawnSync(command, args, {
    stdio: 'inherit',
    env: {
      ...process.env,
      ...envOverrides,
    },
  });

  if (result.error) {
    console.error(`ERROR: ${label} failed: ${result.error.message}`);
    process.exit(1);
  }

  if (result.status !== 0) {
    console.error(`ERROR: ${label} failed with exit code ${result.status}.`);
    process.exit(result.status ?? 1);
  }
}

runStep('Validate product image manifest', npmCmd, ['run', 'product-images:validate-manifest']);
runStep('Run smoke tests', npmCmd, ['test']);

if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
  runStep('Build static catalogue', npmCmd, ['run', 'build']);
} else {
  console.log('\n== Build static catalogue ==');
  console.log('Skipped: define SUPABASE_URL and SUPABASE_ANON_KEY to include build in pre-commit.');
}
