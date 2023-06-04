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
