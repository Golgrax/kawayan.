export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  type: 'CREDIT' | 'DEBIT';
}

export interface Wallet {
  balance: number;
  currency: string;
  transactions: Transaction[];
  subscription: 'FREE' | 'PRO' | 'ENTERPRISE';
}

class PaymentService {
  private getAuthHeader() {
    const token = localStorage.getItem('kawayan_jwt');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  private getUserId() {
    const session = localStorage.getItem('kawayan_session');
    if (!session) return null;
    return JSON.parse(session).id;
  }

  // Get current state
  async getWalletData(): Promise<Wallet> {
    const userId = this.getUserId();
    if (!userId) throw new Error("Not authenticated");

    const response = await fetch(`/api/wallet/${userId}`, {
      headers: this.getAuthHeader()
    });
    
    if (!response.ok) throw new Error("Failed to fetch wallet");
    return response.json();
  }

  // Initiate Top-up (Returns Xendit Checkout URL)
  async initiateTopUp(amount: number): Promise<{ checkoutUrl: string, referenceId: string }> {
    const userId = this.getUserId();
    if (!userId) throw new Error("Not authenticated");

    const response = await fetch('/api/wallet/create-invoice', {
      method: 'POST',
      headers: this.getAuthHeader(),
      body: JSON.stringify({
        userId,
        amount
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create payment invoice");
    }

    const data = await response.json();
    return {
      checkoutUrl: data.checkoutUrl,
      referenceId: data.externalId
    };
  }

  // Confirm Payment (Used after manual verification or webhook)
  async confirmPayment(referenceId: string, amount: number): Promise<boolean> {
    const userId = this.getUserId();
    if (!userId) throw new Error("Not authenticated");

    const response = await fetch('/api/wallet/topup', {
      method: 'POST',
      headers: this.getAuthHeader(),
      body: JSON.stringify({
        userId,
        amount,
        description: `Wallet Top-up (${referenceId})`
      })
    });

    return response.ok;
  }

  async purchaseSubscription(plan: 'PRO' | 'ENTERPRISE', cost: number): Promise<boolean> {
    const userId = this.getUserId();
    if (!userId) throw new Error("Not authenticated");

    const response = await fetch('/api/wallet/purchase', {
      method: 'POST',
      headers: this.getAuthHeader(),
      body: JSON.stringify({
        userId,
        amount: cost,
        description: `Subscription Upgrade: ${plan}`,
        plan
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Purchase failed");
    }

    return true;
  }

  async cancelSubscription(): Promise<boolean> {
    const userId = this.getUserId();
    if (!userId) throw new Error("Not authenticated");

    const response = await fetch('/api/wallet/cancel', {
      method: 'POST',
      headers: this.getAuthHeader(),
      body: JSON.stringify({ userId })
    });

    return response.ok;
  }
}

export const paymentService = new PaymentService();
