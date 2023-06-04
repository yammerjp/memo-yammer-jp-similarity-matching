export async function matching(
  vector: number[],
  PINECONE_API_HOSTNAME: string,
  PINECONE_API_KEY: string,
  PINECONE_API_NAMESPACE: string
): Promise<{ id: string; values: number[]; score: number }[]> {
  let url = `https://${PINECONE_API_HOSTNAME}/query`;
  const headers = {
    "Content-Type": "application/json",
    "Api-Key": PINECONE_API_KEY,
    Accept: "application/json",
  };
  const body = {
    includeValues: "false",
    includeMetadata: "false",
    topK: 10,
    namespace: PINECONE_API_NAMESPACE,
    vector,
  };
  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const json = await response.json();
  console.log(JSON.stringify(json))
  const matches = json?.matches;
  if (
    !Array.isArray(matches) ||
    matches.some(
      (o) =>
        typeof o?.id !== "string" ||
        !Array.isArray(o?.values) ||
        o?.values.some((n) => typeof n !== "number")
    )
  ) {
    console.error(JSON.stringify(json));
    return Promise.reject(
      new Error("failed tto extract matches from response")
    );
  }
  return matches;
}
