type Bindings = {
  SIMILARITY_MATCHING_KV: KVNamespace;
  OPENAI_API_KEY: string;
  PINECONE_API_HOSTNAME: string;
  PINECONE_API_KEY: string;
  PINECONE_API_NAMESPACE: string;
}

// ref: https://zenn.dev/razokulover/articles/abc5d277c2e6d3
import { Hono } from "hono";
import { serveStatic } from "hono/cloudflare-workers";
import { cors } from "hono/cors";
import { matching } from './matching'

const app = new Hono<{Bindings: Bindings}>();

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

app.get("/search", async (c) => {
const ipAddress = c.req.header("CF-Connecting-IP");
  const query = c.req.query("q");
  if (typeof query !== "string") {
    return c.json({ error: "need ?q= query" }, 400);
  }
  const DEBUG = c.req.query("debug");
  const vector = await embedding(query, c.env.OPENAI_API_KEY);
  const matches = await matching(
    vector,
    c.env.PINECONE_API_HOSTNAME,
    c.env.PINECONE_API_KEY,
    c.env.PINECONE_API_NAMESPACE
  );
  const matchingResult = matches.map((m) => ({
    id: m.id,
    url: `https://memo.yammer.jp/posts/${m.id}`,
    similarity: m.score,
  }));

  const articles = await fetchArticleDescriptions()

  const result = matchingResult.map(r => {
    const article = articles.find(a => a.url === r.url)
    return ({
      id: r.id,
      url: r.url,
      similarity: r.similarity,
      ...(article ?? {})
    })
  })

  return c.json({
    query,
    result,
    ...(DEBUG ? { vector, matches, ipAddress } : {}),
  });
});

async function embedding(
  query: string,
  OPENAI_API_KEY: string
): Promise<number[]> {
  let url = "https://api.openai.com/v1/embeddings";
  let headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${OPENAI_API_KEY}`,
  };
  let body = {
    input: query,
    model: "text-embedding-ada-002",
  };

  const response = await fetch(url, {
    method: "POST",
    headers: headers,
    body: JSON.stringify(body),
  });
  const json = await response.json();
  if (!!json?.error) {
    return Promise.reject(
      new Error("failed to be embedding" + JSON.stringify(json.error))
    );
  }
  const data = json?.data;
  if (!Array.isArray(data) || data.length < 1) {
    return Promise.reject(new Error("failed to find data from response"));
  }
  const arr = data[0]?.embedding;
  if (!Array.isArray(arr) || arr.some((v) => typeof v !== "number")) {
    return Promise.reject(
      new Error("failed to extract embedding data from response")
    );
  }
  return arr;
}

async function fetchArticleDescriptions(): Promise<{id: string, url: string, title: string, description: string}[]> {
  const response = await fetch("https://memo.yammer.jp/posts/index.json");
  const json = await response.json();
  return json.items
}

export default app;
