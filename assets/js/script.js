document.addEventListener('DOMContentLoaded', function () {
    // Проверяем доступность API Telegram
    if (typeof window.Telegram.WebApp === 'undefined') {
        document.body.innerHTML = `<div class="error-message"><h1>Ошибка</h1><p>Это веб-приложение предназначено для использования внутри Telegram.</p></div>`;
        return;
    }

    const tg = window.Telegram.WebApp;

    // --- Глобальное Состояние Приложения ---
    const state = {
        products: [],
        cart: [] // Формат: [{ id, name, price, quantity }]
    };

    // --- Основной Объект Приложения ---
    const app = {
        init() {
            tg.ready();
            tg.expand();

            this.loadCart();
            this.updateMainButton();
            this.setupEventListeners();
            
            this.fetchProducts();
        },

        // --- Методы для работы с Корзиной и Хранилищем ---
        loadCart() {
            const savedCart = localStorage.getItem('cascada_cart');
            if (savedCart) {
                state.cart = JSON.parse(savedCart);
            }
        },

        saveCart() {
            localStorage.setItem('cascada_cart', JSON.stringify(state.cart));
        },

        addToCart(productId) {
            const product = state.products.find(p => p.id === productId);
            if (!product) return;

            const cartItem = state.cart.find(item => item.id === productId);
            if (cartItem) {
                cartItem.quantity++;
            } else {
                state.cart.push({ ...product, quantity: 1 });
            }

            this.saveCart();
            this.updateMainButton();
            tg.HapticFeedback.impactOccurred('light');
        },

        // --- Методы для работы с Данными и Отрисовкой ---
        async fetchProducts() {
            try {
                const response = await fetch('./products.json');
                if (!response.ok) throw new Error('Network response was not ok');
                state.products = await response.json();
                this.renderProducts();
            } catch (error) {
                console.error('Failed to fetch products:', error);
                const grid = document.querySelector('.product-grid');
                grid.innerHTML = '<div class="loader">Не удалось загрузить товары.</div>';
            }
        },

        renderProducts() {
            const grid = document.querySelector('.product-grid');
            if (!grid) return;
            grid.innerHTML = ''; // Очищаем контейнер (включая загрузчик)

            state.products.forEach(product => {
                const priceFormatted = product.price.toLocaleString('ru-RU');
                const card = document.createElement('div');
                card.className = 'product-card';
                card.dataset.productId = product.id; // Добавляем data-атрибут для кликов по карточке

                card.innerHTML = `
                    <div class="product-card-content">
                        <img src="${product.image}" alt="${product.name}" class="product-image">
                        <div class="product-info">
                            <h3 class="product-name">${product.name}</h3>
                            <p class="product-price">${priceFormatted} ₽</p>
                        </div>
                        <button class="add-to-cart-btn">В корзину</button>
                    </div>
                `;
                grid.appendChild(card);
            });
        },
        
        // --- Методы для взаимодействия с UI и Telegram API ---
        setupEventListeners() {
            const grid = document.querySelector('.product-grid');
            
            // Используем делегирование событий
            grid.addEventListener('click', (event) => {
                const button = event.target.closest('.add-to-cart-btn');
                const card = event.target.closest('.product-card');

                if (button) {
                    event.stopPropagation();
                    const productId = card.dataset.productId;
                    this.addToCart(productId);
                    
                    // Визуальная обратная связь на кнопке
                    button.innerText = 'Добавлено!';
                    button.classList.add('is-added');
                    setTimeout(() => {
                        button.innerText = 'В корзину';
                        button.classList.remove('is-added');
                    }, 1200);

                } else if (card) {
                    const productName = card.querySelector('.product-name').innerText;
                    tg.showAlert(`Детальный просмотр товара: ${productName}. Эта функция будет добавлена позже.`);
                }
            });

            tg.MainButton.onClick(() => this.showCartDetails());
        },

        updateMainButton() {
            if (state.cart.length > 0) {
                const totalAmount = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                tg.MainButton.setText(`Корзина: ${totalAmount.toLocaleString('ru-RU')} ₽`);
                tg.MainButton.setParams({
                    text_color: '#0d1b2a',
                    color: '#00d1ff',
                    is_visible: true
                });
            } else {
                tg.MainButton.hide();
            }
        },

        showCartDetails() {
            if (state.cart.length === 0) return;

            let message = '<b>Ваш заказ:</b>\n\n';
            state.cart.forEach(item => {
                message += `• ${item.name} (x${item.quantity}) - <b>${(item.price * item.quantity).toLocaleString('ru-RU')} ₽</b>\n`;
            });

            tg.showPopup({
                title: 'Подтверждение заказа',
                message: message,
                buttons: [
                    { id: 'checkout', type: 'default', text: 'Оформить заказ' },
                    { type: 'cancel' },
                ]
            }, (buttonId) => {
                if (buttonId === 'checkout') {
                    tg.sendData(JSON.stringify(state.cart));
                    // Опционально: очистить корзину после отправки
                    // state.cart = [];
                    // this.saveCart();
                    tg.close();
                }
            });
        }
    };

    // --- Запуск Приложения ---
    app.init();
});