/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

// Verified default values for our project
const DEFAULT_URL = "https://vvdqwhnlkxruffcqslyh.supabase.co";
const DEFAULT_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2ZHF3aG5sa3hydWZmY3FzbHloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4MDI5MTAsImV4cCI6MjA5ODM3ODkxMH0.xEmtdDbTP2hwZIVLYOweqLasM4ead5jC37-1xJgFBvQ";

let rawSupabaseUrl = (import.meta.env.VITE_SUPABASE_URL || "").trim();
let rawAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();

// Clean the URL if it contains pathing
if (rawSupabaseUrl && typeof rawSupabaseUrl === 'string') {
  if (rawSupabaseUrl.includes('/rest/v1')) {
    rawSupabaseUrl = rawSupabaseUrl.split('/rest/v1')[0].trim();
  }
}

const isValidUrl = (url: string) => {
  try {
    return url.startsWith('http://') || url.startsWith('https://');
  } catch {
    return false;
  }
};

let finalUrl = DEFAULT_URL;
let finalAnonKey = DEFAULT_ANON_KEY;

// Resolve URL: find whichever of rawSupabaseUrl or rawAnonKey is a valid http URL
if (isValidUrl(rawSupabaseUrl)) {
  finalUrl = rawSupabaseUrl;
} else if (isValidUrl(rawAnonKey)) {
  finalUrl = rawAnonKey;
}

// Resolve Key: prioritize publishable keys (anon), then fallback to secret keys, then default JWT
if (rawAnonKey && rawAnonKey.startsWith('sb_publishable_')) {
  finalAnonKey = rawAnonKey;
} else if (rawSupabaseUrl && rawSupabaseUrl.startsWith('sb_publishable_')) {
  finalAnonKey = rawSupabaseUrl;
} else if (rawAnonKey && (rawAnonKey.startsWith('sb_secret_') || rawAnonKey.includes('.'))) {
  finalAnonKey = rawAnonKey;
} else if (rawSupabaseUrl && (rawSupabaseUrl.startsWith('sb_secret_') || rawSupabaseUrl.includes('.'))) {
  finalAnonKey = rawSupabaseUrl;
}

// Ensure we fall back to DEFAULT_URL if no valid URL is found
if (!isValidUrl(finalUrl)) {
  finalUrl = DEFAULT_URL;
}

console.log("Supabase Client configuration parsed:", {
  url: finalUrl,
  keyPreview: finalAnonKey ? (finalAnonKey.substring(0, 15) + "...") : "None"
});

let supabaseClient = null;
try {
  supabaseClient = createClient(finalUrl, finalAnonKey);
} catch (err) {
  console.error('Failed to create Supabase client:', err);
}

export const supabase = supabaseClient;

export function isSupabaseConfigured(): boolean {
  return supabaseClient !== null;
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
export async function saveOrderToSupabase(order: SupabaseOrder): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: "Supabase client is not initialized" };
  try {
    const { error } = await supabase.from('orders').insert([order]);
    if (error) {
      console.warn('Supabase order insert warning:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.error('Failed to save order to Supabase:', err);
    return { success: false, error: err?.message || String(err) };
  }
}

/**
 * Save a registry to Supabase (if configured)
 */
export async function saveRegistryToSupabase(registry: SupabaseRegistry): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: "Supabase client is not initialized" };
  try {
    // Attempt inserting into 'registries' first
    const { error } = await supabase.from('registries').insert([registry]);
    if (error) {
      console.warn('Supabase registries insert warning:', error.message);
      
      // If that fails, attempt fallback to 'reservations' table
      console.log('Attempting fallback insertion to "reservations" table...');
      const reservationPayload = {
        reservation_id: registry.registry_id,
        name: registry.name,
        occasion: registry.occasion,
        date: registry.date,
        notes: registry.notes || "",
        registrant_name: registry.registrant_name,
        email: registry.email,
        items: JSON.stringify(registry.items)
      };
      
      const { error: resError } = await supabase.from('reservations').insert([reservationPayload]);
      if (resError) {
        console.error('Fallback to reservations table also failed:', resError.message);
        return { success: false, error: `${error.message} (Fallback to reservations failed: ${resError.message})` };
      }
      
      console.log('Fallback insertion to reservations table succeeded!');
      return { success: true };
    }
    return { success: true };
  } catch (err: any) {
    console.error('Failed to save registry to Supabase:', err);
    return { success: false, error: err?.message || String(err) };
  }
}

/**
 * Save an inquiry to Supabase (if configured)
 */
export async function saveInquiryToSupabase(inquiry: SupabaseInquiry): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: "Supabase client is not initialized" };
  try {
    // Attempt full insert first
    const { error } = await supabase.from('inquiries').insert([inquiry]);
    if (error) {
      console.warn('Supabase inquiry insert full-payload warning:', error.message);
      
      // If full insert fails, try a fallback insert with ONLY the columns confirmed 
      // in the user's table editor screenshot: inquiry_id, name, email, specialty, message
      const fallbackPayload = {
        inquiry_id: inquiry.inquiry_id,
        name: inquiry.name,
        email: inquiry.email,
        specialty: inquiry.specialty,
        message: inquiry.message
      };
      
      console.log('Attempting fallback inquiry insert with basic columns...', fallbackPayload);
      const { error: fallbackError } = await supabase.from('inquiries').insert([fallbackPayload]);
      if (fallbackError) {
        console.error('Fallback inquiry insert also failed:', fallbackError.message);
        return { success: false, error: error.message + " (Fallback also failed: " + fallbackError.message + ")" };
      }
      
      console.log('Fallback inquiry insert succeeded!');
      return { success: true };
    }
    return { success: true };
  } catch (err: any) {
    console.error('Failed to save inquiry to Supabase:', err);
    return { success: false, error: err?.message || String(err) };
  }
}
