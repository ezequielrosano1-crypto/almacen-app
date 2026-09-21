import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Se conserva la falta de validación de variables de entorno (bug #8) para mantener la paridad.
export const supabase = createClient(supabaseUrl, supabasePublishableKey);
