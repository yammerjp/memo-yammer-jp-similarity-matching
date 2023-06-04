import type { Context } from 'hono'
import { embedding } from '../lib/fetching/embedding'
import { matching } from '../lib/fetching/matching'
import { fetchArticleDescriptions } from '../lib/fetching/article'
import { ratelimit } from '../lib/ratelimit'

export async function search(c: Context) {
  const ipAddress = c.req.header("CF-Connecting-IP");
  const limit = await ratelimit(ipAddress ?? 'unkwnon', c.env.SIMILARITY_MATCHING_KV)
  if (!!limit) {
    return limit
  }

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
}
