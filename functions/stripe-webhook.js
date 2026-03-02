const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

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

  if (stripeEvent.type === "checkout.session.completed") {
    const session = stripeEvent.data.object;

    // Retrieve line items for fulfillment
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id);

    console.log("Payment successful:", {
      sessionId: session.id,
      customerEmail: session.customer_details?.email,
      items: lineItems.data.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        amount: item.amount_total,
      })),
    });

    // TODO: Send download links for digital items
    // TODO: Create order notification for physical items
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};
