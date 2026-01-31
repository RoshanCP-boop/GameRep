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
    const response = await fetch(decodeURIComponent(url))
    
    if (!response.ok) {
      return res.status(response.status).json({ 
        error: `ITAD API Error: ${response.status}` 
      })
    }

    const data = await response.json()
    return res.status(200).json(data)
  } catch (error) {
    console.error('Proxy error:', error)
    return res.status(500).json({ error: error.message })
  }
}
