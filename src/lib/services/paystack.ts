const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_PUBLIC_KEY = process.env.PAYSTACK_PUBLIC_KEY;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

if (!PAYSTACK_SECRET_KEY || !PAYSTACK_PUBLIC_KEY) {
  console.warn('⚠️  Paystack environment variables are not fully configured.');
  console.warn('   Required: PAYSTACK_SECRET_KEY, PAYSTACK_PUBLIC_KEY');
}

export interface PaystackInitializeData {
  email: string;
  amount: number;
  reference?: string;
  currency?: string;
  callback_url?: string;
  metadata?: Record<string, any>;
  channels?: string[];
  subaccount?: string;
  transaction_charge?: number;
  bearer?: 'account' | 'subaccount';
}

export interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface PaystackVerificationResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    domain: string;
    status: 'success' | 'failed' | 'abandoned';
    reference: string;
    amount: number;
    message: string | null;
    gateway_response: string;
    paid_at: string;
    created_at: string;
    channel: string;
    currency: string;
    ip_address: string;
    metadata: Record<string, any>;
    fees: number;
    customer: {
      id: number;
      first_name: string | null;
      last_name: string | null;
      email: string;
      customer_code: string;
      phone: string | null;
      metadata: Record<string, any> | null;
      risk_action: string;
    };
    authorization: {
      authorization_code: string;
      bin: string;
      last4: string;
      exp_month: string;
      exp_year: string;
      channel: string;
      card_type: string;
      bank: string;
      country_code: string;
      brand: string;
      reusable: boolean;
      signature: string;
      account_name: string | null;
    };
  };
}

export interface PaystackTransaction {
  id: number;
  domain: string;
  status: string;
  reference: string;
  amount: number;
  message: string | null;
  gateway_response: string;
  paid_at: string;
  created_at: string;
  channel: string;
  currency: string;
  ip_address: string;
  metadata: Record<string, any>;
  customer: {
    id: number;
    email: string;
    customer_code: string;
  };
}

export interface PaystackListTransactionsResponse {
  status: boolean;
  message: string;
  data: PaystackTransaction[];
  meta: {
    total: number;
    skipped: number;
    perPage: number;
    page: number;
    pageCount: number;
  };
}

export interface ListTransactionsOptions {
  perPage?: number;
  page?: number;
  customer?: string;
  status?: 'failed' | 'success' | 'abandoned';
  from?: string;
  to?: string;
  amount?: number;
}

async function makePaystackRequest<T>(
  endpoint: string,
  method: 'GET' | 'POST' = 'GET',
  body?: any
): Promise<T> {
  try {
    if (!PAYSTACK_SECRET_KEY) {
      throw new Error('Paystack secret key is not configured. Please set PAYSTACK_SECRET_KEY environment variable.');
    }

    const url = `${PAYSTACK_BASE_URL}${endpoint}`;
    const headers: HeadersInit = {
      'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json'
    };

    const options: RequestInit = {
      method,
      headers
    };

    if (body && method === 'POST') {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `Paystack API error: ${response.statusText}`);
    }

    return data as T;
  } catch (error) {
    console.error('Paystack API request error:', error);
    throw new Error(
      `Paystack request failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function initializePayment(
  data: PaystackInitializeData
): Promise<PaystackInitializeResponse> {
  try {
    if (!data.email || !data.amount) {
      throw new Error('Email and amount are required to initialize payment');
    }

    const amountInKobo = Math.round(data.amount * 100);

    const paymentData = {
      email: data.email,
      amount: amountInKobo,
      reference: data.reference || `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      currency: data.currency || 'NGN',
      callback_url: data.callback_url,
      metadata: data.metadata,
      channels: data.channels,
      subaccount: data.subaccount,
      transaction_charge: data.transaction_charge,
      bearer: data.bearer
    };

    const response = await makePaystackRequest<PaystackInitializeResponse>(
      '/transaction/initialize',
      'POST',
      paymentData
    );

    return response;
  } catch (error) {
    console.error('Payment initialization error:', error);
    throw error;
  }
}

export async function verifyPayment(
  reference: string
): Promise<PaystackVerificationResponse> {
  try {
    if (!reference) {
      throw new Error('Payment reference is required for verification');
    }

    const response = await makePaystackRequest<PaystackVerificationResponse>(
      `/transaction/verify/${reference}`
    );

    return response;
  } catch (error) {
    console.error('Payment verification error:', error);
    throw error;
  }
}

export async function listTransactions(
  options: ListTransactionsOptions = {}
): Promise<PaystackListTransactionsResponse> {
  try {
    const queryParams = new URLSearchParams();

    if (options.perPage) queryParams.append('perPage', options.perPage.toString());
    if (options.page) queryParams.append('page', options.page.toString());
    if (options.customer) queryParams.append('customer', options.customer);
    if (options.status) queryParams.append('status', options.status);
    if (options.from) queryParams.append('from', options.from);
    if (options.to) queryParams.append('to', options.to);
    if (options.amount) queryParams.append('amount', options.amount.toString());

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/transaction?${queryString}` : '/transaction';

    const response = await makePaystackRequest<PaystackListTransactionsResponse>(endpoint);

    return response;
  } catch (error) {
    console.error('List transactions error:', error);
    throw error;
  }
}

export async function getTransaction(id: number): Promise<PaystackVerificationResponse> {
  try {
    if (!id) {
      throw new Error('Transaction ID is required');
    }

    const response = await makePaystackRequest<PaystackVerificationResponse>(
      `/transaction/${id}`
    );

    return response;
  } catch (error) {
    console.error('Get transaction error:', error);
    throw error;
  }
}

export function getPaystackPublicKey(): string {
  if (!PAYSTACK_PUBLIC_KEY) {
    throw new Error('Paystack public key is not configured. Please set PAYSTACK_PUBLIC_KEY environment variable.');
  }
  return PAYSTACK_PUBLIC_KEY;
}

export const paystackService = {
  initializePayment,
  verifyPayment,
  listTransactions,
  getTransaction,
  getPaystackPublicKey
};

export default paystackService;
