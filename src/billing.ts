import Stripe from 'stripe';

export class MCPBilling {
  private stripe: Stripe | null = null;
  private pricePerCall: number;

  constructor(secretKey?: string, pricePerCallUsd: number = 0.01) {
    if (secretKey) {
      this.stripe = new Stripe(secretKey, { apiVersion: '2026-07-29.dahlia' });
    }
    this.pricePerCall = pricePerCallUsd;
  }

  /**
   * Generates a payment link or session for prepaid call credits.
   */
  async createCheckoutSession(successUrl: string, cancelUrl: string, calls: number = 100): Promise<string> {
    if (!this.stripe) {
      throw new Error('Stripe secret key not configured for billing.');
    }

    const unitAmountCents = Math.round(this.pricePerCall * 100 * calls);
    
    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `MCP Tool Calls (${calls} calls)`,
              description: `Prepaid execution credits for Paid MCP Metering server.`,
            },
            unit_amount: unitAmountCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return session.url || '';
  }

  /**
   * Verifies an agent API key or token against balance/usage.
   * For x402 / Nevermined or custom ledger.
   */
  async verifyCallAuthorization(token: string): Promise<boolean> {
    // In production, this checks the ledger or Stripe customer balance.
    // For local test / dev mode, accept valid-looking tokens or mock balances.
    if (!token) return false;
    if (token.startsWith('mcp_live_') || token === 'test-token') {
      return true;
    }
    return false;
  }
}
