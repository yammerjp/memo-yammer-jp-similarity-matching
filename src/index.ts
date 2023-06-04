type Bindings = {
  SIMILARITY_MATCHING_KV: KVNamespace;
  OPENAI_API_KEY: string;
  PINECONE_API_HOSTNAME: string;
  PINECONE_API_KEY: string;
  PINECONE_API_NAMESPACE: string;
}

import { Hono } from "hono";
import { serveStatic } from "hono/cloudflare-workers";
import { cors } from "hono/cors";
import { search } from './controller/search'
import { index } from './controller/index'
import { time } from './controller/time'

const app = new Hono<{Bindings: Bindings}>();

// ref: https://zenn.dev/razokulover/articles/abc5d277c2e6d3
// cors
app.use("*", cors());

// static paths
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
app.use(
  "/logo.png",
  serveStatic({
    path: "./logo.png",
  })
);

app.get("/", index);
app.get("/time", time);
app.get("/search", search);

app.get("/debug", async c => {
  const keys = await c.env.SIMILARITY_MATCHING_KV.list()
  const KV: {[key:string]: { value: string|null, expiration: number|undefined}} = {}
  for(const key of keys.keys) {
    KV[key.name] = {
      value: await c.env.SIMILARITY_MATCHING_KV.get(key.name),
      expiration: key.expiration
    }
  }
  return c.json({KV})
})

export default app;
