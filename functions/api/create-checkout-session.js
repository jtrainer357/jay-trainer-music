const PUBLIC_SITE_URL = "https://jaytrainermusic.com";

const PRODUCT_CATALOG = {
  "price_1TbO6UEOkdyXiRRF5ltDX7zV": {
    name: "Blackout Asylum - Poster",
    unitAmount: 1499,
    image: "/assets/images/poster-blackout-asylum.jpg",
    type: "physical",
  },
  "price_1TbO6VEOkdyXiRRFLlIK8ABn": {
    name: "Jay Trainer - T-Shirt",
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

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

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

const appendParam = (params, key, value) => {
  if (value !== undefined && value !== null && value !== "") {
    params.append(key, String(value));
  }
};

const appendLineItem = (params, item, index) => {
  const catalogItem = PRODUCT_CATALOG[item.priceId];
  const optionSummary = getOptionSummary(item.options);
  const quantity = item.quantity || 1;

  appendParam(params, `line_items[${index}][quantity]`, quantity);

  if (!catalogItem) {
    appendParam(params, `line_items[${index}][price]`, item.priceId);
    return;
  }

  const productName = optionSummary
    ? `${catalogItem.name} (${optionSummary})`
    : catalogItem.name;
  const imageUrl = resolveImageUrl(catalogItem.image);

  appendParam(params, `line_items[${index}][price_data][currency]`, "usd");
  appendParam(params, `line_items[${index}][price_data][unit_amount]`, catalogItem.unitAmount);
  appendParam(params, `line_items[${index}][price_data][product_data][name]`, productName);
  appendParam(params, `line_items[${index}][price_data][product_data][metadata][source_price_id]`, item.priceId);
  appendParam(params, `line_items[${index}][price_data][product_data][metadata][type]`, catalogItem.type);
  appendParam(params, `line_items[${index}][metadata][source_price_id]`, item.priceId);

  if (optionSummary) {
    appendParam(params, `line_items[${index}][price_data][product_data][description]`, optionSummary);
    appendParam(params, `line_items[${index}][metadata][options]`, optionSummary);
  }

  if (imageUrl) {
    appendParam(params, `line_items[${index}][price_data][product_data][images][0]`, imageUrl);
  }
};

export async function onRequestPost({ request, env }) {
  if (!env.STRIPE_SECRET_KEY) {
    console.error("Missing Stripe configuration");
    return json({ error: "Checkout service not configured" }, 500);
  }

  try {
    const { items } = await request.json();

    if (!items || !items.length) {
      return json({ error: "No items provided" }, 400);
    }

    const invalidItem = items.find((item) => !item.priceId || !item.priceId.startsWith("price_"));
    if (invalidItem) {
      return json({ error: "Invalid item price" }, 400);
    }

    const params = new URLSearchParams();
    appendParam(params, "mode", "payment");
    appendParam(params, "success_url", `${PUBLIC_SITE_URL}/cart/success/?session_id={CHECKOUT_SESSION_ID}`);
    appendParam(params, "cancel_url", `${PUBLIC_SITE_URL}/music/`);
    appendParam(params, "metadata[source]", "jay-trainer-website");
    appendParam(
      params,
      "metadata[formats]",
      items.map((item) => `${item.priceId}:${item.format || "mp3"}`).join(",")
    );
    appendParam(
      params,
      "metadata[options]",
      items
        .filter((item) => item.options && Object.keys(item.options).length)
        .map((item) => {
          const options = Object.entries(item.options)
            .map(([key, value]) => `${key}=${value}`)
            .join("|");
          return `${item.name || item.priceId}:${options}:qty=${item.quantity || 1}`;
        })
        .join(",")
    );

    items.forEach((item, index) => appendLineItem(params, item, index));

    const hasPhysicalItems = items.some(
      (item) => item.type === "physical" || PHYSICAL_PRICE_IDS.has(item.priceId)
    );

    if (hasPhysicalItems) {
      appendParam(params, "shipping_address_collection[allowed_countries][0]", "US");
      appendParam(params, "phone_number_collection[enabled]", "true");
    }

    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Stripe checkout error:", data.error?.message || response.status);
      return json({ error: "Failed to create checkout session" }, 500);
    }

    return json({ url: data.url });
  } catch (err) {
    console.error("Stripe checkout error:", err.message);
    return json({ error: "Failed to create checkout session" }, 500);
  }
}

export function onRequest() {
  return json({ error: "Method not allowed" }, 405);
}
