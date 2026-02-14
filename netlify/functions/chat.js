exports.handler = async function(event, context) {
  // 1. Handle CORS Pre-flight requests (Allows your website to connect)
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
      },
      body: "ok"
    };
  }

  try {
    // 2. Parse the incoming data from your website
    const body = JSON.parse(event.body);
    const userMessage = body.prompt;

    // 3. Get the API key securely from Netlify Environment Variables
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
        throw new Error("API Key is missing. Please check Netlify Environment Variables.");
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    // 4. Send the request to Google Gemini
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: userMessage }] }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const botReply = data.candidates[0].content.parts[0].text;

    // 5. Return the successful response to your website
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*" // Required for CORS
      },
      body: JSON.stringify({ reply: botReply })
    };

  } catch (error) {
    // 6. Log the exact error to the Netlify dashboard and return a 500 status
    console.error("Backend Error:", error.message);
    
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ error: error.message })
    };
  }
};
