import { defineConfig, devices } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

function loadRootEnv() {
  const envPath = path.resolve(__dirname, "../..", ".env");
  if (!fs.existsSync(envPath)) return {};

  return Object.fromEntries(
    fs.readFileSync(envPath, "utf8")
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
      }),
  );
}

const rootEnv = loadRootEnv();
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? rootEnv.SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY ?? rootEnv.SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? rootEnv.SUPABASE_SERVICE_ROLE_KEY;

export default defineConfig({
  testDir: "./tests",
  timeout: 30000,
  use: {
    baseURL: "http://127.0.0.1:3013",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: "rm -rf .next/standalone/.next/static .next/standalone/public && cp -R .next/static .next/standalone/.next/static && cp -R public .next/standalone/public && cd .next/standalone && node server.js",
    env: {
      ...process.env,
      HOSTNAME: "127.0.0.1",
      PORT: "3013",
      NEXT_PUBLIC_SUPABASE_URL: supabaseUrl ?? "",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey ?? "",
      SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey ?? "",
    },
    url: "http://127.0.0.1:3013/configurador",
    reuseExistingServer: true,
    timeout: 60000,
  },
});
