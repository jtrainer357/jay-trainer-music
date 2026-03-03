const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  try {
    const { items } = JSON.parse(event.body);

    if (!items || !items.length) {
      return { statusCode: 400, body: JSON.stringify({ error: "No items provided" }) };
    }

    const lineItems = items.map((item) => ({
      price: item.priceId,
      quantity: item.quantity || 1,
    }));

    // Build format metadata from items (e.g. "price_abc:wav,price_def:mp3")
    const formatMeta = items
      .map((item) => `${item.priceId}:${item.format || "mp3"}`)
      .join(",");

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      success_url: `${process.env.URL || "https://jaytrainer.com"}/cart/success/?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.URL || "https://jaytrainer.com"}/music/`,
      metadata: {
        source: "jay-trainer-website",
        formats: formatMeta,
      },
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url }),
    };
  } catch (err) {
    console.error("Stripe checkout error:", err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to create checkout session" }),
    };
  }
};
