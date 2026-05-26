const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const PUBLIC_SITE_URL = (process.env.PUBLIC_SITE_URL || "https://jaytrainermusic.com").replace(/\/$/, "");
const SITE_URL = (process.env.URL || PUBLIC_SITE_URL).replace(/\/$/, "");

const PRODUCT_CATALOG = {
  "price_1TbO6UEOkdyXiRRF5ltDX7zV": {
    name: "Blackout Asylum — Poster",
    unitAmount: 1499,
    image: "/assets/images/poster-blackout-asylum.jpg",
    type: "physical",
  },
  "price_1TbO6VEOkdyXiRRFLlIK8ABn": {
    name: "Jay Trainer — T-Shirt",
    unitAmount: 1699,
    image: "/assets/images/tshirt-blackout-asylum.jpg",
    type: "physical",
  },
  "price_1TbO6VEOkdyXiRRFQIt1Naie": {
    name: "Full Digital Discography",
    unitAmount: 9900,
    image: "/assets/images/full-discography-covers.jpg",
    type: "digital",
  },
};

const PHYSICAL_PRICE_IDS = new Set(
  Object.entries(PRODUCT_CATALOG)
    .filter(([, item]) => item.type === "physical")
    .map(([priceId]) => priceId)
);

const resolveImageUrl = (image) => {
  if (!image) return undefined;
  if (/^https?:\/\//i.test(image)) return image;
  return `${PUBLIC_SITE_URL}${image.startsWith("/") ? "" : "/"}${image}`;
};

const getOptionSummary = (options = {}) =>
  Object.entries(options)
    .filter(([, value]) => value)
    .map(([key, value]) => `${key[0].toUpperCase()}${key.slice(1)}: ${value}`)
    .join(" / ");

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
      const catalogItem = PRODUCT_CATALOG[item.priceId];
      const optionSummary = getOptionSummary(item.options);

      if (catalogItem) {
        const productName = optionSummary
          ? `${catalogItem.name} (${optionSummary})`
          : catalogItem.name;
        const imageUrl = resolveImageUrl(catalogItem.image);

        return {
          price_data: {
            currency: "usd",
            product_data: {
              name: productName,
              ...(optionSummary ? { description: optionSummary } : {}),
              ...(imageUrl ? { images: [imageUrl] } : {}),
              metadata: {
                source_price_id: item.priceId,
                type: catalogItem.type,
              },
            },
            unit_amount: catalogItem.unitAmount,
          },
          quantity: item.quantity || 1,
          metadata: {
            source_price_id: item.priceId,
            ...(optionSummary ? { options: optionSummary } : {}),
          },
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
      success_url: `${SITE_URL}/cart/success/?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}/music/`,
      branding_settings: {
        display_name: "Jay Trainer",
        font_family: "inter",
        border_style: "rounded",
        background_color: "#15110F",
        button_color: "#B9905E",
        icon: {
          type: "url",
          url: `${PUBLIC_SITE_URL}/assets/images/apple-touch-icon.png`,
        },
      },
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
