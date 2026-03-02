exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  try {
    const { firstName, email } = JSON.parse(event.body);

    if (!email) {
      return { statusCode: 400, body: JSON.stringify({ error: "Email is required" }) };
    }

    const apiKey = process.env.CONVERTKIT_API_KEY;
    const formId = process.env.CONVERTKIT_FORM_ID;

    if (!apiKey || !formId) {
      console.error("Missing ConvertKit configuration");
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Newsletter service not configured" }),
      };
    }

    const response = await fetch(
      `https://api.convertkit.com/v3/forms/${formId}/subscribe`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: apiKey,
          email,
          first_name: firstName || "",
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "ConvertKit API error");
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: "Subscribed successfully" }),
    };
  } catch (err) {
    console.error("Newsletter subscribe error:", err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to subscribe" }),
    };
  }
};
