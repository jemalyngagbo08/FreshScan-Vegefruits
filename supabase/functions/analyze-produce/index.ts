import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.105.1/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { imageBase64 } = await req.json();
    if (!imageBase64 || typeof imageBase64 !== "string") {
      return new Response(JSON.stringify({ error: "imageBase64 is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const dataUrl = imageBase64.startsWith("data:")
      ? imageBase64
      : `data:image/jpeg;base64,${imageBase64}`;

    const systemPrompt = `You are an expert in identifying fruits and vegetables and assessing their freshness from images.

Rules:
- ONLY classify fruits or vegetables. If the image contains anything else (people, objects, animals, packaged food, etc.), return detected=false.
- If image is too blurry, dark, or unclear to make a confident determination, return detected=false with a helpful tip.
- If multiple produce items appear, focus on the most prominent / centered one.
- Freshness must be either "fresh" or "rotten". Use visual cues: bruises, mold, discoloration, wrinkles, soft spots, dryness for rotten; vibrant color, firm texture, no blemishes for fresh.
- Always call the report_produce function — never reply in plain text.`;

    const tool = {
      type: "function",
      function: {
        name: "report_produce",
        description: "Report the analysis of a fruit or vegetable image.",
        parameters: {
          type: "object",
          properties: {
            detected: { type: "boolean", description: "Whether a fruit or vegetable was clearly detected." },
            name: { type: "string", description: "Name of the identified fruit or vegetable, e.g., 'Apple', 'Tomato'. Empty string if not detected." },
            category: { type: "string", enum: ["fruit", "vegetable", "unknown"] },
            freshness: { type: "string", enum: ["fresh", "rotten", "unknown"] },
            confidence: { type: "number", description: "Confidence in freshness classification, 0-100." },
            reason: { type: "string", description: "One short sentence explaining the visual reasoning." },
            tip: { type: "string", description: "If detected=false or image is unclear, a helpful tip to the user. Otherwise empty." },
          },
          required: ["detected", "name", "category", "freshness", "confidence", "reason", "tip"],
          additionalProperties: false,
        },
      },
    };

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: "Analyze this image. Identify the fruit/vegetable and whether it's fresh or rotten." },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: "report_produce" } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait a moment and try again." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits in workspace settings." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, t);
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResp.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      return new Response(JSON.stringify({ error: "Could not parse AI response. Try again." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-produce error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
