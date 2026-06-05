import { spawnSync } from "node:child_process";

const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";

function runStep(label, command, args) {
  console.log(`\n== ${label} ==`);
  console.log(`$ ${command} ${args.join(" ")}`);

  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: process.env,
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

runStep("Generate static blog", npmCmd, ["run", "blog:generate-static"]);

if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  runStep("Notify subscribers about new blog posts", npmCmd, ["run", "blog:notify-new-posts"]);
} else {
  console.log("\n== Notify subscribers about new blog posts ==");
  console.log("Skipped: define SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY para activar la automatización de avisos.");
}
