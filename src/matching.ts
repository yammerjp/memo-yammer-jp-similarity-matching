type Match = {
  id: string;
  score: number;
  values: unknown[];
};

type ApiResponse = {
  results: unknown[];
  matches: Match[];
  namespace: string;
};

function isApiResponse(data: any): data is ApiResponse {
  return Array.isArray(data.results)
    && Array.isArray(data.matches)
    && typeof data.namespace === 'string'
    && data.matches.every(isMatch);
}

function isMatch(data: any): data is Match {
  return typeof data.id === 'string'
    && typeof data.score === 'number'
    && Array.isArray(data.values);
}

export async function matching(
  vector: number[],
  PINECONE_API_HOSTNAME: string,
  PINECONE_API_KEY: string,
  PINECONE_API_NAMESPACE: string
): Promise<Match[]> {
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
  if (!response.ok) {
    return Promise.reject(new Error("HTTP error " + response.status))
  }
  const data = await response.json();
  if (!isApiResponse(data)) {
    return Promise.reject("Invalid data structure")
  }
  return data.matches
}
