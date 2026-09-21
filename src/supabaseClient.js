import { createClient } from '@supabase/supabase-js';

/**
 * Extracción segura de variables de entorno compatibles tanto con Vite (import.meta.env)
 * como con entornos Node.js / pruebas unitarias (process.env).
 */
const getEnvVar = (viteKey, fallbackKey, defaultValue = '') => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    if (import.meta.env[viteKey]) return import.meta.env[viteKey];
    if (fallbackKey && import.meta.env[fallbackKey]) return import.meta.env[fallbackKey];
  }
  if (typeof process !== 'undefined' && process.env) {
    if (process.env[viteKey]) return process.env[viteKey];
    if (fallbackKey && process.env[fallbackKey]) return process.env[fallbackKey];
  }
  return defaultValue;
};

export const supabaseUrl = getEnvVar(
  'VITE_SUPABASE_URL',
  'SUPABASE_URL',
  'https://nbdttpplnlxmnsgatslk.supabase.co'
);

export const supabaseAnonKey = getEnvVar(
  'VITE_SUPABASE_ANON_KEY',
  'SUPABASE_ANON_KEY',
  ''
);

// Validación y advertencia en consola si la anon key aún no ha sido configurada
if (!supabaseAnonKey || supabaseAnonKey === 'tu_supabase_anon_key_aqui') {
  console.warn(
    '[SupabaseClient] ⚠️ Advertencia: VITE_SUPABASE_ANON_KEY no está configurada o contiene el valor por defecto en .env.\n' +
    'Por favor, añade tu anon public key obtenida en el panel de Supabase (Project Settings > API).'
  );
}

/**
 * Cliente singleton de Supabase configurado para la aplicación Baby Shower.
 * Se desactiva la persistencia de sesión auth por defecto para evitar sobrecarga en cliente público.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey || 'dummy-key', {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export default supabase;
