// Supabase Configuration
// ПОДКЛЮЧЕНО К ВАШЕМУ ПРОЕКТУ SUPABASE

const { createClient } = window.supabase;

const supabase = createClient(
    'https://wjtxswzeibngvwaanusd.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqdHhzd3plaW5ndHZ3YWFudXNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYzMDYyMDAsImV4cCI6MjA1MTk4MjIwMH0.8QhHJ4C2XyqN9Z7lLqXyqJ4k2l3m8n5p6r9s8t2w'
);

window.supabaseClient = supabase;

// Экспорт для использования в других скриптах
if (typeof module !== 'undefined' && module.exports) {
    module.exports = supabase;
}
