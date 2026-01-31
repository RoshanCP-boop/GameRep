// Vercel Serverless Function to proxy ITAD API requests
// This avoids CORS issues in production

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const { url } = req.query

  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' })
  }

  try {
    const targetUrl = decodeURIComponent(url)
    
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'GameRep/1.0'
      }
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('ITAD API Error:', response.status, errorText)
      return res.status(response.status).json({ 
        error: `ITAD API Error: ${response.status}`,
        details: errorText
      })
    }

    const data = await response.json()
    return res.status(200).json(data)
  } catch (error) {
    console.error('Proxy error:', error)
    return res.status(500).json({ error: error.message })
  }
}
