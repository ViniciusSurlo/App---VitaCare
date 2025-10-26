// src/services/supabaseClient.js
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Substitua com suas chaves Supabase
const SUPABASE_URL = 'https://ctidcbzjozhkbjcotxwc.supabase.co'.trim();
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0aWRjYnpqb3poa2JqY290eHdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5Nzg5NTQsImV4cCI6MjA3NjU1NDk1NH0.jYmAhqlqvakEs6RNMIQF4YLU1jZQ_0mgaFoxfKJ67sc';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});