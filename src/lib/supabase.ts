import { createClient } from '@supabase/supabase-js';

// Load variables from environment (Vite prefixes client-side env vars with VITE_)
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

// Check if credentials are set
const isConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export function isSupabaseConfigured(): boolean {
  return isConfigured;
}

/**
 * Interface representing an Order
 */
export interface SupabaseOrder {
  order_id: string;
  items: Array<{ id: string; name: string; price: number; quantity: number }>;
  total: number;
  address: string;
  notes?: string;
  created_at?: string;
}

/**
 * Interface representing a Gift Registry
 */
export interface SupabaseRegistry {
  registry_id: string;
  name: string;
  occasion: string;
  date: string;
  notes?: string;
  registrant_name: string;
  email: string;
  items: Array<{ productId: string; quantityRequested: number; quantityReceived: number }>;
  created_at?: string;
}

/**
 * Interface representing an Inquiry
 */
export interface SupabaseInquiry {
  inquiry_id: string;
  name: string;
  email: string;
  specialty: string;
  message: string;
  callback: string;
  sealed: boolean;
  date: string;
  created_at?: string;
}

/**
 * Save an order to Supabase (if configured)
 */
export async function saveOrderToSupabase(order: SupabaseOrder): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('orders').insert([order]);
    if (error) {
      console.warn('Supabase order insert warning:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Failed to save order to Supabase:', err);
    return false;
  }
}

/**
 * Save a registry to Supabase (if configured)
 */
export async function saveRegistryToSupabase(registry: SupabaseRegistry): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('registries').insert([registry]);
    if (error) {
      console.warn('Supabase registry insert warning:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Failed to save registry to Supabase:', err);
    return false;
  }
}

/**
 * Save an inquiry to Supabase (if configured)
 */
export async function saveInquiryToSupabase(inquiry: SupabaseInquiry): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('inquiries').insert([inquiry]);
    if (error) {
      console.warn('Supabase inquiry insert warning:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Failed to save inquiry to Supabase:', err);
    return false;
  }
}
