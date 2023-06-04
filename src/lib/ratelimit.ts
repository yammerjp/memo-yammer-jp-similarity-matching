const MAX_REQUESTS_PER_HOUR = 300;

export async function ratelimit(ipAddress: string, KV: KVNamespace): Promise<Response|null> {
  const key = `rate-limit-ip-address-${ipAddress}`
  let count = parseInt(await KV.get(key) ?? '0')
  if (count >= MAX_REQUESTS_PER_HOUR) {
    return new Response(null, {
      status: 429,
      statusText: 'Too Many Requests',
      headers: {
        'Access-Controll-Allow-Origin': '*',
        'Cache-Control': 'max-age=3'
      }
    })
  }
  await KV.put(key, (count + 1).toString(), { expirationTtl: 3600})
  return null
}
