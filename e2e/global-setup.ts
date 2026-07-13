import { readFileSync } from "node:fs";
import path from "node:path";

// e2e 會下真實訂單寫入資料庫；只允許打已知的「測試庫」endpoint，
// 防止 .env.local 被換成正式庫連線後誤跑測試。
// 換測試庫時請把新的 host 加進這份清單（進版控、走 PR 審核）。
const ALLOWED_TEST_DB_HOSTS = [
  "ep-dry-voice-atwvgc1v-pooler.c-9.us-east-1.aws.neon.tech",
];

// 與 Next.js 的優先序一致：已存在的環境變數優先於 .env.local
function resolveDatabaseUrl(): string | undefined {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  try {
    const envFile = readFileSync(
      path.join(process.cwd(), ".env.local"),
      "utf8",
    );
    const line = envFile
      .split("\n")
      .find((l) => l.trim().startsWith("DATABASE_URL="));
    return line
      ?.slice(line.indexOf("=") + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
  } catch {
    return undefined;
  }
}

export default function globalSetup() {
  const url = resolveDatabaseUrl();
  if (!url) {
    throw new Error(
      "e2e 防護：找不到 DATABASE_URL（環境變數或 .env.local），無法確認是測試庫，拒絕執行。",
    );
  }

  let host: string;
  try {
    host = new URL(url).hostname;
  } catch {
    throw new Error(
      "e2e 防護：DATABASE_URL 不是合法的連線字串，無法確認是測試庫，拒絕執行。",
    );
  }

  if (!ALLOWED_TEST_DB_HOSTS.includes(host)) {
    throw new Error(
      `e2e 防護：DATABASE_URL 指向「${host}」，不在允許的測試庫清單內，拒絕執行（測試會寫入真實訂單，避免污染正式庫）。\n` +
      `若這確實是新的測試庫，請把該 host 加入 e2e/global-setup.ts 的 ALLOWED_TEST_DB_HOSTS。`,
    );
  }
}
