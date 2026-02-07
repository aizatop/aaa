// Supabase Configuration
// ПОДКЛЮЧЕНО К ВАШЕМУ ПРОЕКТУ SUPABASE

const { createClient } = window.supabase;

const supabase = createClient(
    'https://wjtxswzeibngvwaanusd.supabase.co',
    'sb_publishable_zuu5cnEHd9vosElaR1wGvw_432g_6Ih'
);

window.supabaseClient = supabase;

// Экспорт для использования в других скриптах
if (typeof module !== 'undefined' && module.exports) {
    module.exports = supabase;
}
