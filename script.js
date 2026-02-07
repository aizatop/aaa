// Global state
let currentUser = null;
let countries = [];
let chatSubscription = null;

// Supabase клиент
const supabase = window.supabaseClient;

// Countries data
const countriesData = [
    {
        id: 1,
        name: 'Япония',
        description: 'Страна восходящего солнца с уникальной культурой, передовыми технологиями и древними традициями',
        image: 'https://resize.tripster.ru/g_luU5kGMuMmG4fN1o0udHBw9yA=/fit-in/1080x1440/filters:no_upscale()/https://cdn.tripster.ru/photos/ab88bae9-9e48-4fa9-ae92-04ea32299330.jpg',
        videoUrl: 'https://youtu.be/YIo2tJSkidk?si=Yzb4eK2ZzfB90s8z',
        attractions: ['Фудзияма', 'Киото', 'Токио', 'Осака', 'Храмы и сады', 'Сакура']
    },
    {
        id: 2,
        name: 'Франция',
        description: 'Романтическая страна с Эйфелевой башней, прекрасной кухней и богатой историей',
        image: 'https://as1.ftcdn.net/jpg/01/47/49/76/1000_F_147497684_2GfgE05sJ8hxeYsZZTm6tBu2EHCc98G2.jpg',
        videoUrl: 'https://youtu.be/EkshFcLESPU?si=SDj9VQYjR9_nb154',
        attractions: ['Эйфелева башня', 'Лувр', 'Нотр-Дам', 'Версаль', 'Лазурный берег', 'Французская кухня']
    },
    {
        id: 3,
        name: 'Италия',
        description: 'Колыбель искусства и истории с невероятной едой, древними руинами и живописными пейзажами',
        image: 'https://img.freepik.com/premium-photo/scenic-view-sea-against-sky_1048944-25393574.jpg?semt=ais_hybrid&w=740',
        videoUrl: 'https://youtu.be/pwivE6bvD8w?si=52ocgv3QkNGHoAH7',
        attractions: ['Рим', 'Венеция', 'Флоренция', 'Колизей', 'Пизанская башня', 'Итальянская кухня']
    },
    {
        id: 4,
        name: 'Лондон',
        description: 'Величественный город с королевскими традициями, современными достопримечательностями и богатой культурой',
        image: 'https://i.pinimg.com/originals/a3/b4/a8/a3b4a8962647ba45905ce683d03a60c6.jpg',
        videoUrl: 'https://youtu.be/SNx8B_oE8IY?si=IQwAu6rWwdCnVBSh',
        attractions: ['Биг-Бен', 'Лондонский Тауэр', 'Букингемский дворец', 'Британский музей', 'Ай-кон', 'Темза']
    }
];

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Проверяем подключение к Supabase
    testSupabaseConnection();
    
    // Инициализируем чат
    initializeChat();
    
    // Загружаем страны
    loadCountries();
    
    // Проверяем статус аутентификации
    checkAuthStatus();
    
    // Устанавливаем слушатели событий
    setupEventListeners();
});

// Тест подключения к Supabase
async function testSupabaseConnection() {
    try {
        console.log('🔍 Тест подключения к Supabase...');
        
        // Пробуем подключиться к таблице
        const { data, error } = await supabase
            .from('messages')
            .select('count')
            .limit(1);
            
        if (error) {
            console.error('❌ Ошибка подключения к Supabase:', error);
            showNotification('Ошибка подключения к базе данных: ' + error.message, 'error');
            return false;
        } else {
            console.log('✅ Подключение к Supabase успешно!');
            showNotification('Подключение к базе данных успешно!', 'success');
            return true;
        }
    } catch (error) {
        console.error('❌ Критическая ошибка Supabase:', error);
        showNotification('Критическая ошибка базы данных', 'error');
        return false;
    }
}

function setupAuthListener() {
    // Слушаем изменения состояния аутентификации
    supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
            currentUser = {
                id: session.user.id,
                email: session.user.email,
                username: session.user.email.split('@')[0],
                session: session
            };
            updateUIForLoggedInUser();
        } else if (event === 'SIGNED_OUT') {
            currentUser = null;
            updateUIForLoggedOutUser();
        }
    });
}

// Chat Functions
async function initializeChat() {
    if (!supabase) {
        console.error('Supabase не настроен. Проверьте supabase-config.js');
        showNotification('Чат временно недоступен', 'warning');
        return;
    }

    // Загружаем историю сообщений
    await loadChatHistory();
    
    // Подписываемся на новые сообщения
    subscribeToChat();
}

async function loadChatHistory() {
    try {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .order('timestamp', { ascending: true })
            .limit(50);

        if (error) {
            console.error('Ошибка загрузки истории чата:', error);
            return;
        }

        // Отображаем загруженные сообщения
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.innerHTML = ''; // Очищаем контейнер

        data.forEach(message => {
            displayChatMessage(message);
        });

        // Прокручиваем вниз
        chatMessages.scrollTop = chatMessages.scrollHeight;
    } catch (error) {
        console.error('Ошибка при загрузке истории:', error);
    }
}

function subscribeToChat() {
    if (chatSubscription) {
        chatSubscription.unsubscribe();
    }

    try {
        chatSubscription = supabase
            .channel('chat-room')
            .on('postgres_changes', 
                { 
                    event: 'INSERT', 
                    schema: 'public', 
                    table: 'messages'
                }, 
                (payload) => {
                    console.log('Realtime сообщение получено:', payload);
                    // Новое сообщение получено
                    displayChatMessage(payload.new);
                    scrollToBottom();
                }
            )
            .subscribe((status) => {
                console.log('Realtime статус:', status);
                if (status === 'SUBSCRIBED') {
                    console.log('✅ Realtime подключен успешно!');
                } else if (status === 'TIMED_OUT' || status === 'CLOSED') {
                    console.log('❌ Realtime отключен, пробуем переподключиться...');
                    setTimeout(subscribeToChat, 5000);
                }
            });
    } catch (error) {
        console.error('❌ Ошибка подписки Realtime:', error);
        showNotification('Ошибка подключения к чату в реальном времени', 'error');
    }
}

function displayChatMessage(message) {
    console.log('Отображение сообщения:', message);
    
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) {
        console.error('Контейнер сообщений не найден!');
        return;
    }
    
    const messageElement = document.createElement('div');
    messageElement.className = 'chat-message';
    
    // Определяем, это сообщение текущего пользователя
    const isOwnMessage = currentUser && message.user_id === currentUser.id;
    
    messageElement.innerHTML = `
        <div class="message-author ${isOwnMessage ? 'own-message' : ''}">
            ${message.username} ${isOwnMessage ? '(вы)' : ''}
        </div>
        <div class="message-content">${escapeHtml(message.text)}</div>
        <div class="message-time">${formatTime(new Date(message.timestamp))}</div>
    `;
    
    chatMessages.appendChild(messageElement);
    console.log('Сообщение добавлено в чат');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// AI Ассистент для чата
async function askAIAssistant(question) {
    try {
        // Показываем что AI печатает
        showAITyping();
        
        // Создаем промпт для AI
        const prompt = `Ты - AI ассистент путешественника по имени "TravelBot". Отвечай на вопросы о путешествиях, странах, достопримечательностях. Будь дружелюбным и полезным. Ответь на русском языке. Вопрос: ${question}`;
        
        // Здесь можно подключить реальный AI API
        // Пока используем заглушки с умными ответами
        const response = await generateAIResponse(question);
        
        // Скрываем что AI печатает
        hideAITyping();
        
        // Отправляем ответ AI в чат
        const aiMessage = {
            id: 'ai-' + Date.now(),
            user_id: 'ai-assistant',
            username: '🤖 TravelBot',
            text: response,
            timestamp: new Date().toISOString(),
            type: 'ai'
        };
        
        displayChatMessage(aiMessage);
        scrollToBottom();
        
    } catch (error) {
        console.error('Ошибка AI ассистента:', error);
        hideAITyping();
        
        // Показываем сообщение об ошибке
        const errorMessage = {
            id: 'ai-error-' + Date.now(),
            user_id: 'ai-assistant',
            username: '🤖 TravelBot',
            text: 'Извините, у меня технические проблемы. Попробуйте спросить позже!',
            timestamp: new Date().toISOString(),
            type: 'ai'
        };
        
        displayChatMessage(errorMessage);
    }
}

// Генерация ответов AI (заглушка)
async function generateAIResponse(question) {
    const lowerQuestion = question.toLowerCase();
    
    // Ответы о странах
    if (lowerQuestion.includes('япония') || lowerQuestion.includes('японию')) {
        return '🇯🇵 Япония - удивительная страна! Рекомендую посетить Токио, Киото, Осаку. Обязательно попробуйте суши, рамен, посетите храмы и насладитесь цветом сакуры весной!';
    }
    
    if (lowerQuestion.includes('франция') || lowerQuestion.includes('париж')) {
        return '🇫🇷 Франция прекрасна! Париж с Эйфелевой башней, Лувр, Ницца на Лазурном берегу. Попробуйте круассаны, вино и сыры. Лучшее время - весна и осень!';
    }
    
    if (lowerQuestion.includes('италия') || lowerQuestion.includes('рим')) {
        return '🇮🇹 Италия - история и романтика! Рим с Колизеем, Венеция с каналами, Флоренция с искусством. Паста, пицца, мороженое - обязательно!';
    }
    
    if (lowerQuestion.includes('лондон') || lowerQuestion.includes('британия')) {
        return '🇬🇧 Лондон - королевская столица! Биг-Бен, Тауэр, Букингемский дворец. Попробуйте английский завтрак, посетите музеи и насладитесь чаепитием!';
    }
    
    // Ответы о путешествиях
    if (lowerQuestion.includes('куда поехать') || lowerQuestion.includes('куда ехать')) {
        return '🌍 Выбор направления зависит от ваших интересов! Для культуры - Европа, для экзотики - Азия, для природы - Скандинавия. Какой тип путешествия вам интересен?';
    }
    
    if (lowerQuestion.includes('документы') || lowerQuestion.includes('виза')) {
        return '📄 Для путешествий обычно нужны: загранпаспорт, виза (если требуется), страховка, билеты. Для Европы - шенгенская виза, для Азии - проверяйте требования каждой страны.';
    }
    
    if (lowerQuestion.includes('бюджет') || lowerQuestion.includes('деньги')) {
        return '💰 Бюджет зависит от направления и стиля путешествия. Европа - €50-100 в день, Азия - €20-50, Америка - €80-150. Экономия: жильё через Airbnb, общественный транспорт, уличная еда.';
    }
    
    // Ответы о достопримечательностях
    if (lowerQuestion.includes('достопримечательност')) {
        return '🏛️ В каждой стране есть свои жемчужины! Европа - Эйфелева башня, Колизей, Биг-Бен. Азия - Великая Китайская стена, Тадж-Махал. Америка - Статуя Свободы, Гранд-Каньон. Что вас интересует?';
    }
    
    // Приветствия
    if (lowerQuestion.includes('привет') || lowerQuestion.includes('здравствуй')) {
        return '👋 Привет! Я TravelBot, ваш AI ассистент по путешествиям! Спрашивайте меня о странах, достопримечательностях, документах, бюджете - я помогу спланировать идеальное путешествие!';
    }
    
    // Ответ по умолчанию
    return '🤔 Интересный вопрос! Я могу рассказать о странах (Япония, Франция, Италия, Лондон), достопримечательностях, документах для поездок, бюджете путешествий. Спросите меня что-нибудь конкретное о путешествиях!';
}

// Показать что AI печатает
function showAITyping() {
    const chatMessages = document.getElementById('chatMessages');
    const typingElement = document.createElement('div');
    typingElement.id = 'ai-typing';
    typingElement.className = 'chat-message ai-message';
    typingElement.innerHTML = `
        <div class="message-author">🤖 TravelBot</div>
        <div class="message-content">
            <span class="typing-dots">
                <span class="dot">●</span>
                <span class="dot">●</span>
                <span class="dot">●</span>
            </span>
        </div>
    `;
    chatMessages.appendChild(typingElement);
    scrollToBottom();
}

// Функции для AI модального окна
function showAIModal() {
    document.getElementById('aiModal').style.display = 'block';
}

function closeAIModal() {
    document.getElementById('aiModal').style.display = 'none';
}

function askAIQuestion(question) {
    closeAIModal();
    askAIAssistant(question);
}

function askCustomAIQuestion() {
    const customQuestion = document.getElementById('aiCustomQuestion').value.trim();
    if (customQuestion) {
        closeAIModal();
        askAIAssistant(customQuestion);
        document.getElementById('aiCustomQuestion').value = '';
    }
}

// Закрытие модального окна при клике вне его
window.onclick = function(event) {
    const aiModal = document.getElementById('aiModal');
    if (event.target == aiModal) {
        aiModal.style.display = 'none';
    }
    
    const loginModal = document.getElementById('loginModal');
    if (event.target == loginModal) {
        loginModal.style.display = 'none';
    }
    
    const registerModal = document.getElementById('registerModal');
    if (event.target == registerModal) {
        registerModal.style.display = 'none';
    }
}

async function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    if (!currentUser) {
        showNotification('Пожалуйста, войдите для отправки сообщений', 'warning');
        showLoginModal();
        return;
    }
    
    try {
        console.log('Отправка сообщения:', { message, username: currentUser.username, user_id: currentUser.id });
        
        const { data, error } = await supabase
            .from('messages')
            .insert({
                text: message,                    // ← Правильное поле
                username: currentUser.username,      // ← Правильное поле
                user_id: currentUser.id,
                type: 'user'
            })
            .select(); // Добавляем select чтобы получить данные обратно

        if (error) {
            console.error('Ошибка отправки сообщения:', error);
            showNotification('Не удалось отправить сообщение: ' + error.message, 'error');
            return;
        }

        console.log('Сообщение успешно отправлено:', data);

        // Очищаем поле ввода
        input.value = '';
        
        // Показываем сообщение сразу (не ждем realtime)
        if (data && data[0]) {
            displayChatMessage(data[0]);
            scrollToBottom();
        }
        
        showNotification('Сообщение отправлено', 'success');
        
    } catch (error) {
        console.error('Ошибка при отправке:', error);
        showNotification('Ошибка соединения: ' + error.message, 'error');
    }
}

function loadCountries() {
    const container = document.getElementById('countriesContainer');
    container.innerHTML = '';
    
    countriesData.forEach(country => {
        const countryCard = createCountryCard(country);
        container.appendChild(countryCard);
    });
}

function createCountryCard(country) {
    const card = document.createElement('div');
    card.className = 'country-card';
    
    // Создаем HTML для достопримечательностей
    const attractionsHtml = country.attractions.map(attraction => 
        `<span class="attraction-tag">${attraction}</span>`
    ).join('');
    
    card.innerHTML = `
        <div class="card-image-wrapper">
            <img src="${country.image}" alt="${country.name}" class="country-image">
            <div class="overlay"></div>
            <a href="${country.videoUrl}" target="_blank" class="play-button" onclick="openVideo('${country.videoUrl}', event)">
                ▶
            </a>
        </div>
        <div class="country-content">
            <h3 class="country-name">${country.name}</h3>
            <p class="country-description">${country.description}</p>
            <div class="attractions-container">
                <h4 class="attractions-title">📍 Главные достопримечательности:</h4>
                <div class="attractions-tags">
                    ${attractionsHtml}
                </div>
            </div>
        </div>
    `;
    return card;
}

function setupEventListeners() {
    // Кнопка входа
    document.getElementById('loginBtn').addEventListener('click', showLoginModal);
    
    // Кнопка выхода
    document.getElementById('logoutBtn').addEventListener('click', logout);
    
    // Кнопка регистрации
    document.getElementById('registerBtn').addEventListener('click', showRegisterModal);
    
    // Закрытие модальных окон
    document.getElementById('closeModal').addEventListener('click', hideLoginModal);
    document.getElementById('closeRegisterModal').addEventListener('click', hideRegisterModal);
    
    // Обработчики форм
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    
    // Поддержка Enter для отправки сообщений
    document.getElementById('sendBtn').addEventListener('click', sendMessage);
    document.getElementById('chatInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    // Close modals on outside click
    window.addEventListener('click', function(e) {
        if (e.target === document.getElementById('loginModal')) {
            hideLoginModal();
        }
        if (e.target === document.getElementById('registerModal')) {
            hideRegisterModal();
        }
    });
}

async function checkAuthStatus() {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
            console.error('Ошибка проверки сессии:', error);
            return;
        }
        
        if (session) {
            currentUser = {
                id: session.user.id,
                email: session.user.email,
                username: session.user.email.split('@')[0],
                session: session
            };
            updateUIForLoggedInUser();
        }
    } catch (error) {
        console.error('Ошибка при проверке авторизации:', error);
    }
}

function updateUIForLoggedInUser() {
    document.getElementById('userInfo').style.display = 'flex';
    document.getElementById('username').textContent = currentUser.username;
    document.getElementById('loginBtn').style.display = 'none';
    document.getElementById('logoutBtn').style.display = 'block';
}

function updateUIForLoggedOutUser() {
    document.getElementById('userInfo').style.display = 'none';
    document.getElementById('loginBtn').style.display = 'block';
    document.getElementById('logoutBtn').style.display = 'none';
}

function showLoginModal() {
    document.getElementById('loginModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function hideLoginModal() {
    document.getElementById('loginModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

function showRegisterModal() {
    hideLoginModal();
    document.getElementById('registerModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function hideRegisterModal() {
    document.getElementById('registerModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    // Clear previous errors
    clearFormErrors('loginForm');
    
    // Validation
    let hasError = false;
    
    if (!validateEmail(email)) {
        showFieldError('email');
        hasError = true;
    }
    
    if (!password || password.length < 6) {
        showFieldError('password');
        hasError = true;
    }
    
    if (hasError) {
        showNotification('Пожалуйста, исправьте ошибки в форме', 'error');
        return;
    }
    
    // Show loading state
    const submitBtn = e.target.querySelector('.submit-btn');
    submitBtn.classList.add('loading');
    submitBtn.textContent = '';
    
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) {
            console.error('Ошибка входа:', error);
            showNotification('Ошибка входа: ' + error.message, 'error');
            return;
        }

        // Получаем профиль пользователя из таблицы users
        const { data: profileData, error: profileError } = await supabase
            .from('users')
            .select('username, full_name')
            .eq('email', email)
            .single();

        let username = email.split('@')[0]; // fallback
        if (profileData && !profileError) {
            username = profileData.username || profileData.full_name || username;
        }
        
        currentUser = {
            id: data.user.id,
            email: data.user.email,
            username: username,
            session: data.session
        };
        
        updateUIForLoggedInUser();
        hideLoginModal();
        
        // Clear form
        document.getElementById('loginForm').reset();
        submitBtn.classList.remove('loading');
        submitBtn.textContent = 'Войти';
        
        showNotification('Добро пожаловать, ' + currentUser.username + '!', 'success');
        
    } catch (error) {
        console.error('Ошибка при входе:', error);
        showNotification('Ошибка соединения', 'error');
        submitBtn.classList.remove('loading');
        submitBtn.textContent = 'Войти';
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const username = document.getElementById('regUsername').value;
    
    // Clear previous errors
    clearFormErrors('registerForm');
    
    // Validation
    let hasError = false;
    
    if (!validateEmail(email)) {
        showFieldError('regEmail');
        hasError = true;
    }
    
    if (!username || username.length < 3) {
        showFieldError('regUsername');
        hasError = true;
    }
    
    if (!password || password.length < 6) {
        showFieldError('regPassword');
        hasError = true;
    }
    
    if (hasError) {
        showNotification('Пожалуйста, исправьте ошибки в форме', 'error');
        return;
    }
    
    // Show loading state
    const submitBtn = e.target.querySelector('.submit-btn');
    submitBtn.classList.add('loading');
    submitBtn.textContent = '';
    
    try {
        // 1. Регистрация в Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    username: username
                }
            }
        });

        if (authError) {
            console.error('Ошибка регистрации:', authError);
            showNotification('Ошибка регистрации: ' + authError.message, 'error');
            return;
        }

        // 2. Создание профиля в таблице users
        const { error: profileError } = await supabase
            .from('users')
            .insert({
                email: email,
                username: username,
                full_name: username
            });

        if (profileError) {
            console.error('Ошибка создания профиля:', profileError);
        }
        
        currentUser = {
            id: authData.user.id,
            email: authData.user.email,
            username: username,
            session: authData.session
        };
        
        updateUIForLoggedInUser();
        hideRegisterModal();
        
        // Clear form
        document.getElementById('registerForm').reset();
        submitBtn.classList.remove('loading');
        submitBtn.textContent = 'Зарегистрироваться';
        
        showNotification('Регистрация успешна! Добро пожаловать, ' + username + '!', 'success');
        
    } catch (error) {
        console.error('Ошибка при регистрации:', error);
        showNotification('Ошибка соединения', 'error');
        submitBtn.classList.remove('loading');
        submitBtn.textContent = 'Зарегистрироваться';
    }
}

async function createUserProfile(user, username = null) {
    try {
        const profileUsername = username || user.email.split('@')[0];
        
        const { error } = await supabase
            .from('profiles')
            .upsert({
                user_id: user.id,
                username: profileUsername,
                email: user.email,
                updated_at: new Date().toISOString()
            });

        if (error) {
            console.error('Ошибка создания профиля:', error);
        }
    } catch (error) {
        console.error('Ошибка при создании профиля:', error);
    }
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function showFieldError(fieldId) {
    const field = document.getElementById(fieldId);
    const formGroup = field.closest('.form-group');
    formGroup.classList.remove('success');
    formGroup.classList.add('error');
    
    // Remove error on input
    field.addEventListener('input', function() {
        formGroup.classList.remove('error');
        if (validateField(field)) {
            formGroup.classList.add('success');
        }
    }, { once: false });
}

function validateField(field) {
    if (field.type === 'email') {
        return validateEmail(field.value);
    } else if (field.type === 'password') {
        return field.value.length >= 6;
    } else if (field.type === 'text') {
        return field.value.length >= 3;
    }
    return false;
}

function clearFormErrors(formId) {
    const form = document.getElementById(formId);
    const errorGroups = form.querySelectorAll('.form-group.error, .form-group.success');
    errorGroups.forEach(group => {
        group.classList.remove('error', 'success');
    });
}

async function logout() {
    try {
        const { error } = await supabase.auth.signOut();
        
        if (error) {
            console.error('Ошибка выхода:', error);
            showNotification('Ошибка выхода', 'error');
            return;
        }
        
        currentUser = null;
        updateUIForLoggedOutUser();
        showNotification('Вы вышли из аккаунта', 'info');
        
    } catch (error) {
        console.error('Ошибка при выходе:', error);
        showNotification('Ошибка соединения', 'error');
    }
}

function openVideo(videoUrl, event) {
    event.preventDefault();
    
    showNotification('Открытие видео в новой вкладке...', 'info');
    
    // Открываем видео в новой вкладке
    window.open(videoUrl, '_blank');
}

function playVideo(countryName) {
    if (!currentUser) {
        showNotification('Пожалуйста, войдите для просмотра видео', 'warning');
        showLoginModal();
        return;
    }
    
    showNotification(`Загрузка видео о ${countryName}...`, 'info');
    
    // Simulate video loading
    setTimeout(() => {
        showNotification(`Видео о ${countryName} готово к просмотру!`, 'success');
    }, 2000);
}

function formatTime(date) {
    return date.toLocaleTimeString('ru-RU', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

function setupSmoothScroll() {
    // Smooth scroll for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            scrollToSection(targetId);
        });
    });
}

function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        animation: slideInRight 0.3s ease;
        max-width: 300px;
        word-wrap: break-word;
    `;
    
    // Set background color based on type
    switch (type) {
        case 'success':
            notification.style.background = 'linear-gradient(135deg, #6da87c 0%, #5cb85c 100%)';
            break;
        case 'error':
            notification.style.background = 'linear-gradient(135deg, #d97777 0%, #dc3545 100%)';
            break;
        case 'warning':
            notification.style.background = 'linear-gradient(135deg, #ffc107 0%, #ff9800 100%)';
            break;
        default:
            notification.style.background = 'linear-gradient(135deg, #17a2b8 0%, #007bff 100%)';
    }
    
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }
    }, 3000);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100px);
        }
    }
`;
document.head.appendChild(style);
