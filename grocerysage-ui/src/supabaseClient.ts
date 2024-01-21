import { createClient } from '@supabase/supabase-js'
import { ENV_VARIABLES } from './env'

export const supabase = createClient(ENV_VARIABLES.SUPABASE_URL, ENV_VARIABLES.SUPABASE_KEY);
