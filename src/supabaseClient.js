import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://yjwdvcrlfpeqrsrqkkmi.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlqd2R2Y3JsZnBlcXJzcnFra21pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzNTk2MzQsImV4cCI6MjA2OTkzNTYzNH0.tnSa4V-REx6sLhn9lOh3wvsPN-RvGC0RPmR_FASx1uU'

export const supabase = createClient(supabaseUrl, supabaseKey)
