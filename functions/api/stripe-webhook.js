const encoder = new TextEncoder();

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const timingSafeEqual = (a, b) => {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i += 1) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
};

const bytesToHex = (bytes) =>
  [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join("");

const verifyStripeSignature = async ({ body, signature, secret }) => {
  if (!signature || !secret) return false;
  const parts = Object.fromEntries(
    signature.split(",").map((part) => {
      const [key, value] = part.split("=");
      return [key, value];
    })
  );

  if (!parts.t || !parts.v1) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signedPayload = `${parts.t}.${body}`;
  const digest = await crypto.subtle.sign("HMAC", key, encoder.encode(signedPayload));
  return timingSafeEqual(bytesToHex(digest), parts.v1);
};

const formatMoney = (amount, currency = "usd") => {
  if (typeof amount !== "number") return "n/a";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
};

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const formatAddress = (shippingDetails = {}) => {
  const address = shippingDetails.address || {};
  return [
    shippingDetails.name,
    address.line1,
    address.line2,
    [address.city, address.state, address.postal_code].filter(Boolean).join(", "),
    address.country,
  ].filter(Boolean);
};

const stripeGet = async ({ env, path }) => {
  const response = await fetch(`https://api.stripe.com/v1${path}`, {
    headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` },
  });
  if (!response.ok) {
    throw new Error(`Stripe API failed: ${response.status}`);
  }
  return response.json();
};

const sendOrderNotification = async ({ env, session, lineItems }) => {
  if (!env.RESEND_API_KEY) {
    console.warn("Order notification skipped: RESEND_API_KEY is not configured.");
    return;
  }

  const to = env.ORDER_NOTIFICATION_TO || "jtrainer@gmail.com";
  const from = env.ORDER_NOTIFICATION_FROM || "Jay Trainer Store <onboarding@resend.dev>";
  const addressLines = formatAddress(session.shipping_details);
  const customer = session.customer_details || {};
  const currency = session.currency || "usd";
  const items = (lineItems.data || []).map((item) => ({
    name: item.description || "Item",
    quantity: item.quantity || 1,
    amount: formatMoney(item.amount_total, item.currency || currency),
  }));
  const dashboardUrl = `https://dashboard.stripe.com/payments/${session.payment_intent}`;

  const text = [
    "New Jay Trainer store order",
    "",
    `Total: ${formatMoney(session.amount_total, currency)}`,
    `Stripe session: ${session.id}`,
    `Stripe payment: ${session.payment_intent || "n/a"}`,
    "",
    "Customer",
    `Name: ${customer.name || session.shipping_details?.name || "n/a"}`,
    `Email: ${customer.email || "n/a"}`,
    `Phone: ${customer.phone || "n/a"}`,
    "",
    "Ship to",
    addressLines.length ? addressLines.join("\n") : "No shipping address collected",
    "",
    "Items",
    items.map((item) => `- ${item.name} x ${item.quantity} - ${item.amount}`).join("\n"),
    "",
    dashboardUrl,
  ].join("\n");

  const html = `
    <div style="font-family: Inter, Arial, sans-serif; color: #15110f; line-height: 1.5;">
      <h1 style="margin: 0 0 16px;">New Jay Trainer store order</h1>
      <p style="font-size: 18px; margin: 0 0 20px;"><strong>Total:</strong> ${escapeHtml(formatMoney(session.amount_total, currency))}</p>
      <h2 style="font-size: 16px; margin: 24px 0 8px;">Customer</h2>
      <p style="margin: 0;">${escapeHtml(customer.name || session.shipping_details?.name || "n/a")}<br>${escapeHtml(customer.email || "n/a")}<br>${escapeHtml(customer.phone || "n/a")}</p>
      <h2 style="font-size: 16px; margin: 24px 0 8px;">Ship to</h2>
      <p style="margin: 0;">${addressLines.length ? addressLines.map(escapeHtml).join("<br>") : "No shipping address collected"}</p>
      <h2 style="font-size: 16px; margin: 24px 0 8px;">Items</h2>
      <ul>${items.map((item) => `<li>${escapeHtml(item.name)} x ${escapeHtml(item.quantity)} - ${escapeHtml(item.amount)}</li>`).join("")}</ul>
      <p style="margin: 24px 0 0;"><a href="${escapeHtml(dashboardUrl)}">Open payment in Stripe</a></p>
    </div>
  `;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: customer.email || undefined,
      subject: `New Jay Trainer order - ${formatMoney(session.amount_total, currency)}`,
      text,
      html,
    }),
  });

  if (!response.ok) {
    throw new Error(`Resend order notification failed: ${response.status}`);
  }
};

export async function onRequestPost({ request, env }) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  const verified = await verifyStripeSignature({
    body,
    signature,
    secret: env.STRIPE_WEBHOOK_SECRET,
  });

  if (!verified) {
    console.error("Webhook signature verification failed");
    return new Response("Webhook signature verification failed", { status: 400 });
  }

  const event = JSON.parse(body);

  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded"
  ) {
    const session = event.data.object;
    try {
      const lineItems = await stripeGet({
        env,
        path: `/checkout/sessions/${session.id}/line_items?limit=100`,
      });
      await sendOrderNotification({ env, session, lineItems });
    } catch (err) {
      console.error("Order notification failed:", err.message);
    }
  }

  return json({ received: true });
}

export function onRequest() {
  return json({ error: "Method not allowed" }, 405);
}
