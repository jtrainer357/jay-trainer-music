const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const PHYSICAL_PRICE_IDS = new Set([
  "price_1TbO6UEOkdyXiRRF5ltDX7zV",
  "price_1TbO6VEOkdyXiRRFLlIK8ABn",
]);

const FULL_DISCOGRAPHY_PRICE_ID = "price_1TbO6VEOkdyXiRRFQIt1Naie";

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  try {
    const { items } = JSON.parse(event.body);

    if (!items || !items.length) {
      return { statusCode: 400, body: JSON.stringify({ error: "No items provided" }) };
    }

    const invalidItem = items.find((item) => !item.priceId || !item.priceId.startsWith("price_"));
    if (invalidItem) {
      return { statusCode: 400, body: JSON.stringify({ error: "Invalid item price" }) };
    }

    const lineItems = items.map((item) => {
      if (item.priceId === FULL_DISCOGRAPHY_PRICE_ID) {
        return {
          price_data: {
            currency: "usd",
            product_data: {
              name: item.name || "Full Digital Discography",
            },
            unit_amount: 9900,
          },
          quantity: item.quantity || 1,
        };
      }

      return {
        price: item.priceId,
        quantity: item.quantity || 1,
      };
    });

    const hasPhysicalItems = items.some(
      (item) => item.type === "physical" || PHYSICAL_PRICE_IDS.has(item.priceId)
    );

    // Build format metadata from items (e.g. "price_abc:wav,price_def:mp3")
    const formatMeta = items
      .map((item) => `${item.priceId}:${item.format || "mp3"}`)
      .join(",");

    const optionMeta = items
      .filter((item) => item.options && Object.keys(item.options).length)
      .map((item) => {
        const options = Object.entries(item.options)
          .map(([key, value]) => `${key}=${value}`)
          .join("|");
        return `${item.name || item.priceId}:${options}:qty=${item.quantity || 1}`;
      })
      .join(",");

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      success_url: `${process.env.URL || "https://jaytrainermusic.com"}/cart/success/?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.URL || "https://jaytrainermusic.com"}/music/`,
      metadata: {
        source: "jay-trainer-website",
        formats: formatMeta,
        options: optionMeta,
      },
      ...(hasPhysicalItems
        ? {
            shipping_address_collection: {
              allowed_countries: ["US"],
            },
            phone_number_collection: {
              enabled: true,
            },
          }
        : {}),
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
