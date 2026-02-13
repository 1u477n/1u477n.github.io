export default async (request, context) => {
  // 1. Handle Pre-flight requests (CORS)
  // This allows the browser to confirm the "neural connection" is safe.
  if (request.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  try {
    // 2. Get the user's message
    const body = await request.json();
    const userMessage = body.prompt;

    // 3. Prepare the API request to Gemini
    const apiKey = Netlify.env.get("GEMINI_API_KEY");
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    // 4. Call the AI
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: userMessage }] }]
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json(); // Variable is defined here

    // 5. Send the successful answer back with CORS headers
    const botReply = data.candidates[0].content.parts[0].text;

    return new Response(JSON.stringify({ reply: botReply }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });

  } catch (error) {
    // 6. Handle errors gracefully
    console.error("Function Error:", error.message);
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
};
