// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { 
    getDatabase, 
    ref, 
    push, 
    set, 
    onChildAdded, 
    onChildRemoved, 
    remove 
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

// Ваши конфигурационные параметры Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCDANEx7FB-U9Wj8ZItneroCA_sfmEUYAU",
    authDomain: "pechat-61e3f.firebaseapp.com",
    projectId: "pechat-61e3f",
    storageBucket: "pechat-61e3f.appspot.com",
    messagingSenderId: "33694902344",
    appId: "1:33694902344:web:43deb2fe82202bbf9a507d"
};

// Инициализация Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Заданный пароль для удаления чеков
const DELETE_PASSWORD = "123"; // Замените на ваш пароль

// Функция для открытия модального окна
function openModal(fasonName, basePrice, imagePath) {
    const modal = document.getElementById('orderModal');
    if (!modal) {
        console.error('Modal element not found');
        return;
    }
    modal.style.display = 'block';
    const modalTitle = document.getElementById('modalTitle');
    const basePriceElement = document.getElementById('basePrice');
    const fasonImagePathInput = document.getElementById('fasonImagePath');

    if (!modalTitle || !basePriceElement || !fasonImagePathInput) {
        console.error('One or more modal elements not found');
        return;
    }

    modalTitle.innerText = fasonName;
    basePriceElement.innerText = `Базовая цена: ${basePrice} сум`;
    document.getElementById('totalAmount').innerText = basePrice;
    document.getElementById('remainingAmount').innerText = basePrice; // Инициализация оставшейся суммы
    fasonImagePathInput.value = imagePath; // Сохраняем путь к изображению для дальнейшего использования
    updateTotal();
}

// Функция для закрытия модального окна
function closeModal() {
    const modal = document.getElementById('orderModal');
    if (!modal) {
        console.error('Modal element not found');
        return;
    }
    modal.style.display = 'none';
    const orderForm = document.getElementById('orderForm');
    if (orderForm) {
        orderForm.reset();
    }
    document.getElementById('totalAmount').innerText = '0';
    document.getElementById('remainingAmount').innerText = '0';
}

// Функция для обновления итоговой суммы
function updateTotal() {
    const basePriceText = document.getElementById('basePrice').innerText;
    const basePriceMatch = basePriceText.match(/(\d+)/);
    const basePrice = basePriceMatch ? parseInt(basePriceMatch[1], 10) : 0;

    let total = isNaN(basePrice) ? 0 : basePrice;

    const addPocket = document.getElementById('addPocket').checked ? parseInt(document.getElementById('addPocket').value, 10) : 0;
    const addReflector = document.getElementById('addReflector').checked ? parseInt(document.getElementById('addReflector').value, 10) : 0;
    const addFrontLogo = document.getElementById('addFrontLogo').checked ? parseInt(document.getElementById('addFrontLogo').value, 10) : 0;
    const addBackLogo = document.getElementById('addBackLogo').checked ? parseInt(document.getElementById('addBackLogo').value, 10) : 0;
    const addRibana = document.getElementById('addRibana').checked ? parseInt(document.getElementById('addRibana').value, 10) : 0;

    total += addPocket + addReflector + addFrontLogo + addBackLogo + addRibana;

    document.getElementById('totalAmount').innerText = total;
    updateBalance();
}

// Функция для обновления баланса
function updateBalance() {
    const totalAmount = parseInt(document.getElementById('totalAmount').innerText, 10) || 0;
    const depositAmount = parseInt(document.getElementById('depositAmount').value, 10) || 0;
    const remainingAmount = totalAmount - depositAmount;
    document.getElementById('remainingAmount').innerText = remainingAmount;
}

// Функция для генерации чека и добавления его в Firebase
function generateReceipt() {
    const fasonName = document.getElementById('modalTitle').innerText;
    const totalAmount = document.getElementById('totalAmount').innerText;
    const depositAmount = document.getElementById('depositAmount').value;
    const color = document.getElementById('colorSelect').value;
    const notes = document.getElementById('notes').value;
    const date = document.getElementById('dateSelect').value;
    const clientName = document.getElementById('clientName').value;
    const clientCompany = document.getElementById('clientCompany').value;
    const clientPhone = document.getElementById('clientPhone').value;
    const fasonImagePath = document.getElementById('fasonImagePath').value;

    const addPocket = document.getElementById('addPocket').checked ? true : false;
    const addReflector = document.getElementById('addReflector').checked ? true : false;
    const addFrontLogo = document.getElementById('addFrontLogo').checked ? true : false;
    const addBackLogo = document.getElementById('addBackLogo').checked ? true : false;
    const addRibana = document.getElementById('addRibana').checked ? true : false;

    // Проверка обязательных полей
    if (!clientName || !clientPhone) {
        alert("Пожалуйста, заполните обязательные поля: Имя клиента и Номер телефона клиента.");
        return;
    }

    // Сохранение заказа в Firebase Realtime Database
    const ordersRef = ref(database, 'orders');
    const newOrderRef = push(ordersRef);
    set(newOrderRef, {
        fasonName: fasonName,
        totalAmount: totalAmount,
        depositAmount: depositAmount,
        color: color,
        notes: notes,
        date: date, // Дата дедлайна
        clientName: clientName,
        clientCompany: clientCompany,
        clientPhone: clientPhone,
        addPocket: addPocket,
        addReflector: addReflector,
        addFrontLogo: addFrontLogo,
        addBackLogo: addBackLogo,
        addRibana: addRibana,
        fasonImagePath: fasonImagePath,
        timestamp: Date.now()
    })
    .then(() => {
        // Закрываем модальное окно и сбрасываем форму после успешного сохранения
        closeModal();
    })
    .catch((error) => {
        alert("Ошибка при сохранении заказа: " + error.message);
    });
}

// Функция для печати чека
function printReceipt(button) {
    const receiptElement = button.closest('.receipt');
    if (!receiptElement) {
        console.error('Receipt element not found');
        return;
    }

    const originalContents = document.body.innerHTML;

    // Клонируем чек для модификации
    const receiptClone = receiptElement.cloneNode(true);

    // Скрываем кнопки "Распечатать" и "Удалить" перед печатью
    const buttons = receiptClone.querySelectorAll('button');
    buttons.forEach(btn => btn.style.display = 'none');

    // Заменяем содержимое body на клонированный чек
    document.body.innerHTML = receiptClone.outerHTML;

    window.print();

    // Восстанавливаем исходное содержимое страницы
    document.body.innerHTML = originalContents;

    // Перезагружаем страницу, чтобы вернуть все обработчики событий
    window.location.reload();
}

// Функция для удаления чека с проверкой пароля
function deleteReceipt(orderId) {
    // Запрашиваем пароль у пользователя
    const userPassword = prompt("Введите пароль для удаления чека:");

    // Проверяем введённый пароль
    if (userPassword === DELETE_PASSWORD) {
        if (confirm("Вы уверены, что хотите удалить этот чек?")) {
            const orderRef = ref(database, `orders/${orderId}`);
            remove(orderRef)
                .then(() => {
                    console.log(`Чек ${orderId} успешно удален.`);
                })
                .catch((error) => {
                    alert("Ошибка при удалении чека: " + error.message);
                });
        }
    } else {
        alert("Неверный пароль. Удаление чека отменено.");
    }
}

// Функция для расчета разницы в днях между двумя датами
function calculateDaysRemaining(deadlineDate) {
    const currentDate = new Date();
    const deadline = new Date(deadlineDate);
    
    // Сброс времени до полуночи для точного расчета дней
    currentDate.setHours(0, 0, 0, 0);
    deadline.setHours(0, 0, 0, 0);
    
    const diffTime = deadline - currentDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
}

// Функция для определения класса мигания на основе оставшихся дней
function getBlinkClass(daysRemaining) {
    if (daysRemaining <= 5) {
        return 'blink-black';
    } else if (daysRemaining <= 10) {
        return 'blink-red';
    } else if (daysRemaining <= 15) {
        return 'blink-yellow';
    } else {
        return ''; // Без мигания
    }
}

// Функция для создания и добавления чека в DOM
function renderReceipt(orderId, orderData) {
    const {
        fasonName,
        totalAmount,
        depositAmount,
        color,
        notes,
        date,
        clientName,
        clientCompany,
        clientPhone,
        addPocket,
        addReflector,
        addFrontLogo,
        addBackLogo,
        addRibana,
        fasonImagePath,
        timestamp
    } = orderData;

    // Вычисляем оставшиеся дни до дедлайна
    const daysRemaining = calculateDaysRemaining(date);

    // Определяем класс мигания
    const blinkClass = getBlinkClass(daysRemaining);

    // Создаем новый элемент чека
    const receiptElement = document.createElement('div');
    receiptElement.classList.add('receipt');
    if (blinkClass) {
        receiptElement.classList.add(blinkClass);
    }
    receiptElement.setAttribute('data-id', orderId); // Добавляем атрибут с ID заказа

    let receiptContent = `
        <div class="receipt-details">
            <h3>Чек №${timestamp}</h3>
            <p><strong>Фасон:</strong> ${fasonName}</p>
            <p><strong>Цвет:</strong> ${color || 'Не выбран'}</p>
            ${addPocket ? `<p>Добавлен карман (10 000 сум)</p>` : ''}
            ${addReflector ? `<p>Добавлен отражатель (10 000 сум)</p>` : ''}
            ${addFrontLogo ? `<p>Добавлен логотип спереди (10 000 сум)</p>` : ''}
            ${addBackLogo ? `<p>Добавлен логотип сзади (10 000 сум)</p>` : ''}
            ${addRibana ? `<p>Добавлена рибана (10 000 сум)</p>` : ''}
            ${notes ? `<p><strong>Примечание:</strong> ${notes}</p>` : ''}
            <p class="totalAmount"><strong>Итоговая сумма:</strong> ${totalAmount} сум</p>
            <p class="depositAmount"><strong>Залог:</strong> ${depositAmount} сум</p>
            <p><strong>Дата дедлайна:</strong> ${date}</p>
            <p><strong>Имя клиента:</strong> ${clientName}</p>
            <p><strong>Компания клиента:</strong> ${clientCompany || 'Не указано'}</p>
            <p><strong>Телефон клиента:</strong> ${clientPhone}</p>
            <div class="button-group">
                <button onclick="printReceipt(this)" class="print-button">Распечатать</button>
                <button onclick="deleteReceipt('${orderId}')" class="delete-button">Удалить</button>
            </div>
        </div>
        <img src="${fasonImagePath}" alt="${fasonName}">
    `;

    receiptElement.innerHTML = receiptContent;

    // Добавляем чек в секцию чеков
    document.getElementById('receiptsList').prepend(receiptElement);
}

// Функция поиска товаров (фасонов)
function searchItems() {
    const query = document.getElementById('itemSearch').value.toLowerCase();
    const items = document.querySelectorAll('.catalog-items .item');

    items.forEach(item => {
        const title = item.querySelector('.item-content h3').innerText.toLowerCase();
        const description = item.querySelector('.item-content p').innerText.toLowerCase();
        if (title.includes(query) || description.includes(query)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

// Функция поиска чеков (заказов)
function searchReceipts() {
    const query = document.getElementById('receiptSearch').value.toLowerCase();
    const receipts = document.querySelectorAll('.receipts-list .receipt');

    receipts.forEach(receipt => {
        const details = receipt.querySelector('.receipt-details');
        if (!details) return; // Пропускаем, если нет деталей
        const texts = Array.from(details.querySelectorAll('p')).map(p => p.innerText.toLowerCase()).join(' ');
        if (texts.includes(query)) {
            receipt.style.display = window.innerWidth <= 768 ? 'flex' : 'flex'; // Восстанавливаем flex, если ранее был скрыт
        } else {
            receipt.style.display = 'none';
        }
    });
}

// Установка слушателя для новых заказов
const ordersRef = ref(database, 'orders');
onChildAdded(ordersRef, (data) => {
    renderReceipt(data.key, data.val());
});

// Установка слушателя для удаленных заказов
onChildRemoved(ordersRef, (data) => {
    const receiptToRemove = document.querySelector(`.receipt[data-id="${data.key}"]`);
    if (receiptToRemove) {
        receiptToRemove.remove();
    }
});

// Закрытие модального окна при клике вне его
window.onclick = function(event) {
    const modal = document.getElementById('orderModal');
    if (event.target == modal) {
        closeModal();
    }
}

// Экспортируем функции в глобальную область видимости
window.openModal = openModal;
window.closeModal = closeModal;
window.updateTotal = updateTotal;
window.updateBalance = updateBalance;
window.generateReceipt = generateReceipt;
window.printReceipt = printReceipt;
window.deleteReceipt = deleteReceipt;
window.searchItems = searchItems;
window.searchReceipts = searchReceipts;
