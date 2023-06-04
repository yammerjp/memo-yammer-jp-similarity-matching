type EmbeddingData = {
  object: string;
  index: number;
  embedding: number[];
};

type Usage = {
  prompt_tokens: number;
  total_tokens: number;
};

type EmbeddingResponse = {
  object: string;
  data: EmbeddingData[];
  model: string;
  usage: Usage;
};

function isEmbeddingResponse(data: any): data is EmbeddingResponse {
  return typeof data.object === 'string'
    && Array.isArray(data.data)
    && typeof data.model === 'string'
    && typeof data.usage === 'object'
    && data.data.every(isEmbeddingData)
    && isUsage(data.usage);
}

function isEmbeddingData(data: any): data is EmbeddingData {
  return typeof data.object === 'string'
    && typeof data.index === 'number'
    && Array.isArray(data.embedding)
    && data.embedding.every((element: any) => typeof element === 'number');
}

function isUsage(data: any): data is Usage {
  return typeof data.prompt_tokens === 'number'
    && typeof data.total_tokens === 'number';
}

export async function embedding(
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
  if (!response.ok) {
    return Promise.reject(new Error("HTTP error " + response.status))
  }
  const data = await response.json()
  if (!isEmbeddingResponse(data) || data.data.length == 0) {
      return Promise.reject(new Error("Invalid data structure"));
  }
  return data.data[0].embedding
}
