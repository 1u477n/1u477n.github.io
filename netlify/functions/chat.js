export default async (request, context) => {
  // 1. Get the user's message from the website
  const body = await request.json();
  const userMessage = body.prompt;

  // 2. Prepare the API request to Gemini (or OpenAI)
  const apiKey = Netlify.env.get("GEMINI_API_KEY"); // Securely loaded
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  // 3. Call the AI
  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: userMessage }] }]
      })
    });

    const data = await response.json();
    
    // 4. Send the answer back to your website
    return new Response(JSON.stringify({ 
      reply: data.candidates[0].content.parts[0].text 
    }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    return new Response(JSON.stringify({ reply: data.candidates[0].content.parts[0].text }), {
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*", // Allows your GitHub site to talk to Netlify
        "Access-Control-Allow-Headers": "Content-Type"
      }
    });
  }
};
