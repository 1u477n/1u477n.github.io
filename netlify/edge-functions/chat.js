// netlify/edge-functions/chat.js

// Define the required CORS headers for cross-domain communication

// SECURITY UPGRADE: Only allow requests from github domain
// "Access-Control-Allow-Origin": "*", // Or explicitly set "https://1u477n.github.io"
const corsHeaders = {
  "Access-Control-Allow-Origin": "https://1u477n.github.io", 
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

export default async (request, context) => {
  // 1. Handle the OPTIONS Preflight Request
  // This is required before the browser allows the actual POST request
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204, // No Content
      headers: corsHeaders
    });
  }

  try {
    // 2. Parse the incoming JSON request
    const body = await request.json();
    const userMessage = body?.prompt;
    if (!userMessage) throw new Error("No prompt provided.");

    // 3. Get the Gemini API Key
    const apiKey = Netlify.env.get("GEMINI_API_KEY");
    if (!apiKey) throw new Error("GEMINI_API_KEY is missing in Netlify.");

    // 4. Construct the streaming API URL
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${apiKey}`;

    // 5. Fetch the Server-Sent Events stream from Google
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

    // 6. Return the stream directly to the browser WITH CORS headers
    return new Response(response.body, {
      headers: {
        ...corsHeaders, // Inject the CORS headers into the final response
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
      }
    });

  } catch (error) {
    console.error("Edge Error:", error.message);
    // Return error responses with CORS headers so the frontend can read the error
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
};

// Map this edge function to a clean API route
export const config = { path: "/api/chat" };
