// Supabase Configuration
// ЗАМЕНИТЕ ЭТИ ЗНАЧЕНИЯ НА ВАШИ КЛЮЧИ ИЗ SUPABASE

const { createClient } = window.supabase;

const supabase = createClient(
    'https://your-project-id.supabase.co',    // ЗАМЕНИТЕ на ваш Project URL
    'your-anon-public-key-here'             // ЗАМЕНИТЕ на ваш anon public key
);

window.supabaseClient = supabase;

// Экспорт для использования в других скриптах
if (typeof module !== 'undefined' && module.exports) {
    module.exports = supabase;
}
