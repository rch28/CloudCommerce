export type EmailEvent =
  | { type: "order_confirmation"; to: string; orderNumber: string; customerName: string; total: number }
  | { type: "order_shipped"; to: string; orderNumber: string; customerName: string }
  | { type: "order_delivered"; to: string; orderNumber: string; customerName: string }
  | { type: "password_reset"; to: string; resetLink: string };

export interface EmailProvider {
  send(event: EmailEvent): Promise<void>;
}

class ConsoleEmailProvider implements EmailProvider {
  async send(event: EmailEvent): Promise<void> {
    switch (event.type) {
      case "order_confirmation":
        console.log(`[EMAIL] Order confirmation to ${event.to}: Order #${event.orderNumber} confirmed for $${event.total}`);
        break;
      case "order_shipped":
        console.log(`[EMAIL] Shipping update to ${event.to}: Order #${event.orderNumber} has been shipped`);
        break;
      case "order_delivered":
        console.log(`[EMAIL] Delivery update to ${event.to}: Order #${event.orderNumber} has been delivered`);
        break;
      case "password_reset":
        console.log(`[EMAIL] Password reset to ${event.to}: ${event.resetLink}`);
        break;
    }
  }
}

let provider: EmailProvider = new ConsoleEmailProvider();

export function setEmailProvider(p: EmailProvider) {
  provider = p;
}

export async function sendEmail(event: EmailEvent): Promise<void> {
  try {
    await provider.send(event);
  } catch {
    console.error(`[EMAIL] Failed to send ${event.type} to ${"to" in event ? (event as { to: string }).to : "unknown"}`);
  }
}
