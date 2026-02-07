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

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    loadCountries();
    setupEventListeners();
    checkAuthStatus();
    setupSmoothScroll();
    initializeChat();
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
            .eq('room_id', 'general')
            .order('created_at', { ascending: true })
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

    chatSubscription = supabase
        .channel('chat-room')
        .on('postgres_changes', 
            { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'messages',
                filter: 'room_id=eq.general'
            }, 
            (payload) => {
                // Новое сообщение получено
                displayChatMessage(payload.new);
                scrollToBottom();
            }
        )
        .subscribe();
}

function displayChatMessage(message) {
    const chatMessages = document.getElementById('chatMessages');
    const messageElement = document.createElement('div');
    messageElement.className = 'chat-message';
    
    // Определяем, это сообщение текущего пользователя
    const isOwnMessage = currentUser && message.user_id === currentUser.id;
    
    messageElement.innerHTML = `
        <div class="message-author ${isOwnMessage ? 'own-message' : ''}">
            ${message.username} ${isOwnMessage ? '(вы)' : ''}
        </div>
        <div class="message-content">${escapeHtml(message.content)}</div>
        <div class="message-time">${formatTime(new Date(message.created_at))}</div>
    `;
    
    chatMessages.appendChild(messageElement);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function scrollToBottom() {
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.scrollTop = chatMessages.scrollHeight;
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
        const { error } = await supabase
            .from('messages')
            .insert({
                content: message,
                username: currentUser.username,
                user_id: currentUser.id,
                room_id: 'general'
            });

        if (error) {
            console.error('Ошибка отправки сообщения:', error);
            showNotification('Не удалось отправить сообщение', 'error');
            return;
        }

        // Очищаем поле ввода
        input.value = '';
        
        // Сообщение появится через realtime подписку
        showNotification('Сообщение отправлено', 'success');
        
    } catch (error) {
        console.error('Ошибка при отправке:', error);
        showNotification('Ошибка соединения', 'error');
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
    // Navigation
    document.getElementById('loginBtn').addEventListener('click', showLoginModal);
    document.getElementById('logoutBtn').addEventListener('click', logout);
    document.getElementById('getStartedBtn').addEventListener('click', () => scrollToSection('countries'));
    
    // Modal
    document.getElementById('closeModal').addEventListener('click', hideLoginModal);
    document.getElementById('closeRegisterModal').addEventListener('click', hideRegisterModal);
    document.getElementById('showRegister').addEventListener('click', showRegisterModal);
    document.getElementById('showLogin').addEventListener('click', showLoginModal);
    
    // Forms
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    
    // Chat
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

function checkAuthStatus() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        updateUIForLoggedInUser();
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

function handleLogin(e) {
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
    
    // Simulate API call
    setTimeout(() => {
        const user = {
            id: Date.now(),
            email: email,
            username: email.split('@')[0],
            loginTime: new Date().toISOString()
        };
        
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        updateUIForLoggedInUser();
        hideLoginModal();
        
        // Clear form
        document.getElementById('loginForm').reset();
        submitBtn.classList.remove('loading');
        submitBtn.textContent = 'Войти';
        
        showNotification('Добро пожаловать, ' + user.username + '!', 'success');
    }, 1500);
}

function handleRegister(e) {
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
    
    // Simulate API call
    setTimeout(() => {
        const user = {
            id: Date.now(),
            email: email,
            username: username,
            registerTime: new Date().toISOString()
        };
        
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        updateUIForLoggedInUser();
        hideRegisterModal();
        
        // Clear form
        document.getElementById('registerForm').reset();
        submitBtn.classList.remove('loading');
        submitBtn.textContent = 'Зарегистрироваться';
        
        showNotification('Регистрация успешна! Добро пожаловать, ' + username + '!', 'success');
    }, 1500);
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

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    updateUIForLoggedOutUser();
    showNotification('Вы вышли из аккаунта', 'info');
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
