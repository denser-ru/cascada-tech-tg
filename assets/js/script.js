document.addEventListener('DOMContentLoaded', function() {
    // Проверяем, доступен ли объект Telegram Web App
    if (typeof window.Telegram.WebApp === 'undefined') {
        console.error("Telegram WebApp API not available.");
        // Можно скрыть страницу и показать сообщение
        document.body.innerHTML = `
            <div style="color: #ffffff; text-align: center; padding-top: 50px;">
                <h1>Ошибка</h1>
                <p>Это веб-приложение предназначено для использования внутри Telegram.</p>
            </div>
        `;
        return; // Прекращаем выполнение скрипта
    }

    const tg = window.Telegram.WebApp;

    // 1. Инициализация Telegram Web App
    tg.ready();
    tg.expand();
    
    // 2. Адаптация темы - ЗАКОММЕНТИРОВАНА
    // Мы используем свой собственный брендированный темный стиль,
    // поэтому адаптация под светлую/темную тему Telegram нам не нужна.
    /*
    if (tg.themeParams) {
        document.documentElement.style.setProperty('--tg-theme-bg-color', tg.themeParams.bg_color);
        document.documentElement.style.setProperty('--tg-theme-text-color', tg.themeParams.text_color);
        document.documentElement.style.setProperty('--tg-theme-hint-color', tg.themeParams.hint_color);
        document.documentElement.style.setProperty('--tg-theme-link-color', tg.themeParams.link_color);
        document.documentElement.style.setProperty('--tg-theme-button-color', tg.themeParams.button_color);
        document.documentElement.style.setProperty('--tg-theme-button-text-color', tg.themeParams.button_text_color);
        document.documentElement.style.setProperty('--tg-theme-secondary-bg-color', tg.themeParams.secondary_bg_color);
    }
    */
    
    // 3. Настройка MainButton (Главная кнопка Telegram)
    let cart = []; // Наша импровизированная корзина

    function updateMainButton() {
        if (cart.length > 0) {
            let totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            
            // Настраиваем кнопку
            tg.MainButton.setText(`Корзина: ${totalAmount.toLocaleString('ru-RU')} ₽`);
            // Задаем цвета для кнопки, чтобы она соответствовала нашему стилю
            tg.MainButton.setParams({
                text_color: '#0d1b2a', // Темный текст, как на наших кнопках
                color: '#00d1ff',      // Ярко-голубой цвет
                is_visible: true
            });
        } else {
            tg.MainButton.hide();
        }
    }

    // Назначаем действие на главную кнопку
    tg.MainButton.onClick(function() {
        if (cart.length > 0) {
            // В реальном приложении здесь будет tg.sendData(JSON.stringify(cart));
            tg.showConfirm(
                `Вы уверены, что хотите оформить заказ на сумму ${tg.MainButton.text.split(': ')[1]}?`, 
                function(isConfirmed) {
                    if (isConfirmed) {
                        // Отправляем данные боту
                        tg.sendData(JSON.stringify(cart));
                        // Закрываем приложение после отправки
                        tg.close();
                    }
                }
            );
        }
    });

    // 4. Обработка кликов по кнопкам "В корзину"
    const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');
    addToCartButtons.forEach(button => {
        button.addEventListener('click', function(event) {
            event.stopPropagation(); // Останавливаем всплытие события, если карточка тоже кликабельна
            
            const productId = this.dataset.productId;
            const productName = this.dataset.productName;
            const productPrice = parseFloat(this.dataset.productPrice);

            const existingItem = cart.find(item => item.id === productId);
            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                cart.push({ id: productId, name: productName, price: productPrice, quantity: 1 });
            }
            
            // Тактильный отклик
            tg.HapticFeedback.impactOccurred('light');

            // Меняем текст на кнопке для обратной связи
            this.innerText = 'Добавлено!';
            this.style.backgroundColor = '#0b8aab'; // Немного темнее, чтобы показать, что товар уже в корзине
            setTimeout(() => {
                this.innerText = 'В корзину';
                this.style.backgroundColor = '#00d1ff'; // Возвращаем исходный цвет
            }, 1000); // Через 1 секунду

            updateMainButton();
        });
    });

    // Первоначальный вызов для настройки кнопки при загрузке
    updateMainButton();
});