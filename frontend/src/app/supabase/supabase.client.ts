import { createClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { Database } from './supabase.types';

export const supabaseClient = createClient<Database>(environment.supabaseUrl, environment.supabase_publishable_key);
