const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export async function onRequestPost({ request, env }) {
  try {
    const { firstName, email } = await request.json();

    if (!email) {
      return json({ error: "Email is required" }, 400);
    }

    if (!env.CONVERTKIT_API_KEY || !env.CONVERTKIT_FORM_ID) {
      console.error("Missing ConvertKit configuration");
      return json({ error: "Newsletter service not configured" }, 500);
    }

    const response = await fetch(
      `https://api.convertkit.com/v3/forms/${env.CONVERTKIT_FORM_ID}/subscribe`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: env.CONVERTKIT_API_KEY,
          email,
          first_name: firstName || "",
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "ConvertKit API error");
    }

    return json({ success: true, message: "Subscribed successfully" });
  } catch (err) {
    console.error("Newsletter subscribe error:", err.message);
    return json({ error: "Failed to subscribe" }, 500);
  }
}

export function onRequest() {
  return json({ error: "Method not allowed" }, 405);
}
