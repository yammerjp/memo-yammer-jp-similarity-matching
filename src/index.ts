// ref: https://zenn.dev/razokulover/articles/abc5d277c2e6d3
import { Hono } from "hono";
import { serveStatic } from "hono/cloudflare-workers";
import { cors } from "hono/cors";

const app = new Hono();

// CORS設定。ChatGPTにプラグイン登録するときにやっておかないと警告が出たので追加した。
app.use("*", cors());
// `./assets`が静的ファイルのルートディレクトリになっているのでserveStaticに指定するpathは`./assets`配下から
app.use(
  "/.well-known/ai-plugin.json",
  serveStatic({
    path: "./.well-known/ai-plugin.json",
  })
);
app.use(
  "/openapi.yaml",
  serveStatic({
    path: "./openapi.yaml",
  })
);
// logoファイルも一応必要なので適当に
app.use(
  "/logo.png",
  serveStatic({
    path: "./logo.png",
  })
);
// これはなくてもOK。ルートにリクエストして何も返ってこないと気持ち悪いので追加しておいた。
app.get("/", (c) => {
  return c.json({
    message: "What time is it now?",
  });
});
// UTC時間で現在時刻を返すだけのコード
app.get("/time", (c) => {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  const hours = String(now.getUTCHours()).padStart(2, "0");
  const minutes = String(now.getUTCMinutes()).padStart(2, "0");
  const seconds = String(now.getUTCSeconds()).padStart(2, "0");
  return c.json({
    now: `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`,
  });
});

export default app;
