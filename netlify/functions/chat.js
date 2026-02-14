exports.handler = async function(event, context) {
  // 1. Handle CORS Pre-flight
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
    // 2. Parse Body Safely
    let body;
    try {
        body = JSON.parse(event.body);
    } catch(e) {
        body = event.body; 
    }
    
    const userMessage = body?.prompt;
    if (!userMessage) throw new Error("No prompt provided from the website.");

    // 3. API Key Check
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY environment variable is missing.");

    // ==========================================
    // THE FIX: Upgrading to the active model (Gemini 2.5 Flash)
    // ==========================================
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    // 4. Fetch from Gemini
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: userMessage }] }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API Error (${response.status}): ${errorText}`);
    }

    const data = await response.json();

    // 5. Safety Check: Prevent crashes on unexpected data
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error("Unexpected response structure from Google: " + JSON.stringify(data));
    }

    const botReply = data.candidates[0].content.parts[0].text;

    // 6. Success Return
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ reply: botReply })
    };

  } catch (error) {
    // 7. Diagnostic Error Return
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
