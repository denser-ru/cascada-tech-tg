document.addEventListener('DOMContentLoaded', function() {
    if (typeof window.Telegram.WebApp === 'undefined') {
        console.error("Telegram WebApp API not available.");
        document.body.innerHTML = `<div style="color: #ffffff; text-align: center; padding: 50px;"><h1>Ошибка</h1><p>Это веб-приложение предназначено для использования внутри Telegram.</p></div>`;
        return;
    }

    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();
    
    let cart = [];

    function updateMainButton() {
        if (cart.length > 0) {
            let totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            tg.MainButton.setText(`Корзина: ${totalAmount.toLocaleString('ru-RU')} ₽`);
            tg.MainButton.setParams({
                text_color: '#0d1b2a',
                color: '#00d1ff',
                is_visible: true
            });
        } else {
            tg.MainButton.hide();
        }
    }

    // НОВАЯ ФУНКЦИЯ: Показать состав корзины
    function showCartDetails() {
        if (cart.length === 0) return;

        let message = '<b>Ваш заказ:</b>\n\n';
        let totalAmount = 0;
        cart.forEach(item => {
            message += `• ${item.name} (x${item.quantity}) - <b>${(item.price * item.quantity).toLocaleString('ru-RU')} ₽</b>\n`;
            totalAmount += item.price * item.quantity;
        });
        message += `\n<b>Итого: ${totalAmount.toLocaleString('ru-RU')} ₽</b>`;

        tg.showPopup({
            title: 'Подтверждение заказа',
            message: message,
            buttons: [
                { id: 'checkout', type: 'default', text: 'Оформить заказ' },
                { id: 'close', type: 'cancel' },
            ]
        }, function(buttonId) {
            if (buttonId === 'checkout') {
                tg.sendData(JSON.stringify(cart));
                tg.close();
            }
        });
    }

    tg.MainButton.onClick(showCartDetails);

    // НОВАЯ ФУНКЦИЯ: Добавление товара в корзину
    function addToCart(productId, productName, productPrice) {
        const existingItem = cart.find(item => item.id === productId);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({ id: productId, name: productName, price: productPrice, quantity: 1 });
        }
        tg.HapticFeedback.impactOccurred('light');
        updateMainButton();
    }
    
    // --- Привязка событий ---
    
    // Клик по карточкам
    document.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('click', function() {
            const btn = this.querySelector('.add-to-cart-btn');
            const productName = btn.dataset.productName;
            
            // TODO: Заменить этот алерт на открытие красивого модального окна или новой страницы с деталями товара
            tg.showAlert(`Вы кликнули на товар: ${productName}. В будущем здесь будет страница с его детальным описанием.`);
        });
    });

    // Клик по кнопкам "В корзину"
    document.querySelectorAll('.add-to-cart-btn').forEach(button => {
        button.addEventListener('click', function(event) {
            event.stopPropagation(); // Предотвращаем срабатывание клика по карточке
            
            addToCart(
                this.dataset.productId,
                this.dataset.productName,
                parseFloat(this.dataset.productPrice)
            );
            
            // Улучшенная обратная связь
            button.innerText = 'Добавлено!';
            button.classList.add('is-added');
            setTimeout(() => {
                button.innerText = 'В корзину';
                button.classList.remove('is-added');
            }, 1200);
        });
    });

    updateMainButton();
});