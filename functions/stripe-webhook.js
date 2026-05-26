const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const ORDER_NOTIFICATION_TO = process.env.ORDER_NOTIFICATION_TO || "jtrainer@gmail.com";
const ORDER_NOTIFICATION_FROM = process.env.ORDER_NOTIFICATION_FROM || "Jay Trainer Store <onboarding@resend.dev>";

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const formatMoney = (amount, currency = "usd") => {
  if (typeof amount !== "number") return "n/a";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
};

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

const buildOrderEmail = ({ session, lineItems }) => {
  const addressLines = formatAddress(session.shipping_details);
  const customer = session.customer_details || {};
  const currency = session.currency || "usd";
  const dashboardUrl = `https://dashboard.stripe.com/payments/${session.payment_intent}`;
  const items = lineItems.data.map((item) => ({
    name: item.description || "Item",
    quantity: item.quantity || 1,
    amount: formatMoney(item.amount_total, item.currency || currency),
  }));

  const itemText = items
    .map((item) => `- ${item.name} x ${item.quantity} — ${item.amount}`)
    .join("\n");

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
    itemText || "No line items found",
    "",
    dashboardUrl,
  ].join("\n");

  const html = `
    <div style="font-family: Inter, Arial, sans-serif; color: #15110f; line-height: 1.5;">
      <h1 style="margin: 0 0 16px;">New Jay Trainer store order</h1>
      <p style="font-size: 18px; margin: 0 0 20px;"><strong>Total:</strong> ${escapeHtml(formatMoney(session.amount_total, currency))}</p>

      <h2 style="font-size: 16px; margin: 24px 0 8px;">Customer</h2>
      <p style="margin: 0;">
        ${escapeHtml(customer.name || session.shipping_details?.name || "n/a")}<br>
        ${escapeHtml(customer.email || "n/a")}<br>
        ${escapeHtml(customer.phone || "n/a")}
      </p>

      <h2 style="font-size: 16px; margin: 24px 0 8px;">Ship to</h2>
      <p style="margin: 0;">${addressLines.length ? addressLines.map(escapeHtml).join("<br>") : "No shipping address collected"}</p>

      <h2 style="font-size: 16px; margin: 24px 0 8px;">Items</h2>
      <table style="border-collapse: collapse; width: 100%; max-width: 680px;">
        <thead>
          <tr>
            <th align="left" style="border-bottom: 1px solid #ddd; padding: 8px 0;">Item</th>
            <th align="center" style="border-bottom: 1px solid #ddd; padding: 8px;">Qty</th>
            <th align="right" style="border-bottom: 1px solid #ddd; padding: 8px 0;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((item) => `
            <tr>
              <td style="border-bottom: 1px solid #eee; padding: 10px 0;">${escapeHtml(item.name)}</td>
              <td align="center" style="border-bottom: 1px solid #eee; padding: 10px;">${escapeHtml(item.quantity)}</td>
              <td align="right" style="border-bottom: 1px solid #eee; padding: 10px 0;">${escapeHtml(item.amount)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>

      <p style="margin: 24px 0 0;">
        <a href="${escapeHtml(dashboardUrl)}">Open payment in Stripe</a>
      </p>
      <p style="color: #666; font-size: 13px;">Checkout session: ${escapeHtml(session.id)}</p>
    </div>
  `;

  return { text, html };
};

const sendOrderNotification = async ({ session, lineItems }) => {
  if (!process.env.RESEND_API_KEY) {
    console.warn("Order notification skipped: RESEND_API_KEY is not configured.");
    return;
  }

  const { text, html } = buildOrderEmail({ session, lineItems });
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: ORDER_NOTIFICATION_FROM,
      to: [ORDER_NOTIFICATION_TO],
      reply_to: session.customer_details?.email || undefined,
      subject: `New Jay Trainer order — ${formatMoney(session.amount_total, session.currency || "usd")}`,
      text,
      html,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Resend order notification failed: ${res.status} ${errorText}`);
  }
};

exports.handler = async (event) => {
  const sig = event.headers["stripe-signature"];

  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  if (
    stripeEvent.type === "checkout.session.completed" ||
    stripeEvent.type === "checkout.session.async_payment_succeeded"
  ) {
    const session = stripeEvent.data.object;

    // Retrieve line items for fulfillment
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 100 });

    console.log("Payment successful:", {
      sessionId: session.id,
      customerEmail: session.customer_details?.email,
      items: lineItems.data.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        amount: item.amount_total,
      })),
    });

    try {
      await sendOrderNotification({ session, lineItems });
    } catch (err) {
      console.error("Order notification failed:", err.message);
    }
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};
