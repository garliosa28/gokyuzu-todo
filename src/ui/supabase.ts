import { createClient } from '@supabase/supabase-js'

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** .env ayarlanmamışsa null: uygulama yalnızca yerel çalışır. */
export const supabase = supabaseUrl && key ? createClient(supabaseUrl, key) : null
