// pages/api/assistant.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({ message: 'Query is required' });
    }

    // Here you would typically call an external API like OpenAI or any other text-to-speech service
    // For demo purposes, we'll return a mock response

    // Call your external API using environment variables
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://your-api-endpoint.com/chat';
      const API_KEY = process.env.API_KEY;
      
      const apiResponse = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': API_KEY ? `Bearer ${API_KEY}` : ''
        },
        body: JSON.stringify({ 
          message: query
        })
      });
      
      if (!apiResponse.ok) {
        throw new Error('API request failed with status: ' + apiResponse.status);
      }
      
      const data = await apiResponse.json();
      
      // Process the API response following the format {text: "response text", audio: "s3 link"}
      return res.status(200).json({
        text: data.text,
        audioUrl: data.audio  // Map audio to audioUrl for our frontend
      });
    } catch (error) {
      console.error('External API error:', error);
      
      // Fallback mock response
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Return a mock response in the expected format
      return res.status(200).json({
        text: "Hi this is api response",
        audioUrl: "https://mock-s3-bucket.s3.amazonaws.com/sample-audio.mp3" // Example S3 link
      });
    
  }} catch (error) {
    console.error('Error processing request:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}