// main.js

// Импортируем необходимые функции из Firebase SDK
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

// Конфигурация Firebase
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

// Пароль для удаления чеков
const DELETE_PASSWORD = "123"; // Замените на ваш пароль

// Переменные для пошагового оформления
let selectedFasons = [];
let currentStep = 0;

// Добавляем обработчики событий после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    // Кнопка "Оформить Заказ"
    const orderButton = document.getElementById('orderButton');
    if (orderButton) {
        orderButton.addEventListener('click', openModal);
    }

    // Кнопка закрытия модального окна
    const modalClose = document.querySelector('#orderModal .close');
    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }

    // Кнопки навигации в модальном окне
    const prevButton = document.getElementById('prevButton');
    const nextButton = document.getElementById('nextButton');
    if (prevButton && nextButton) {
        prevButton.addEventListener('click', prevStep);
        nextButton.addEventListener('click', nextStep);
    }

    // Поле поиска товаров
    const itemSearchInput = document.getElementById('itemSearch');
    if (itemSearchInput) {
        itemSearchInput.addEventListener('input', searchItems);
    }

    // Поле поиска чеков
    const receiptSearchInput = document.getElementById('receiptSearch');
    if (receiptSearchInput) {
        receiptSearchInput.addEventListener('input', searchReceipts);
    }

    // Закрытие модального окна при клике вне его
    window.addEventListener('click', (event) => {
        const modal = document.getElementById('orderModal');
        if (event.target == modal) {
            closeModal();
        }
    });
});

// Функция открытия модального окна с выбранными фасонами
function openModal() {
    const modal = document.getElementById('orderModal');
    if (!modal) {
        console.error('Modal элемент не найден');
        return;
    }

    // Получаем все выбранные фасоны
    const selectedFasonElements = Array.from(document.querySelectorAll('.selectFason:checked')).map(checkbox => ({
        name: checkbox.dataset.name,
        price: parseInt(checkbox.dataset.price, 10),
        image: checkbox.dataset.image
    }));

    if (selectedFasonElements.length === 0) {
        alert("Пожалуйста, выберите хотя бы один фасон для заказа.");
        return;
    }

    selectedFasons = selectedFasonElements;
    currentStep = 0;

    // Очищаем предыдущие данные в модальном окне
    const stepContainer = document.getElementById('stepContainer');
    if (!stepContainer) {
        console.error('Step Container элемент не найден');
        return;
    }
    stepContainer.innerHTML = '';

    // Отображаем первый фасон
    displayCurrentStep();

    // Показываем модальное окно
    modal.style.display = 'block';
}

// Функция закрытия модального окна
function closeModal() {
    const modal = document.getElementById('orderModal');
    if (!modal) {
        console.error('Modal элемент не найден');
        return;
    }
    modal.style.display = 'none';
    resetOrderForm();
}

// Функция сброса формы заказа
function resetOrderForm() {
    const stepContainer = document.getElementById('stepContainer');
    if (stepContainer) {
        stepContainer.innerHTML = '';
    }
    const navigationButtons = document.getElementById('navigationButtons');
    if (navigationButtons) {
        const prevButton = navigationButtons.querySelector('#prevButton');
        const nextButton = navigationButtons.querySelector('#nextButton');
        if (prevButton) prevButton.disabled = true;
        if (nextButton) nextButton.innerText = 'Далее';
    }
    selectedFasons = [];
    currentStep = 0;
}

// Функция отображения текущего шага
function displayCurrentStep() {
    const stepContainer = document.getElementById('stepContainer');
    if (!stepContainer) {
        console.error('Step Container элемент не найден');
        return;
    }

    // Очищаем предыдущий шаг
    stepContainer.innerHTML = '';

    // Проверяем, завершен ли процесс выбора фасонов
    if (currentStep < selectedFasons.length) {
        // Получаем текущий фасон
        const fason = selectedFasons[currentStep];
        if (!fason) {
            console.error('Фасон на текущем шаге не найден');
            return;
        }

        // Создаем элемент для текущего шага
        const fasonDiv = document.createElement('div');
        fasonDiv.classList.add('selected-fason');

        fasonDiv.innerHTML = `
            <img src="${fason.image}" alt="${fason.name}" class="selected-fason-img">
            <div class="selected-fason-details">
                <h4>${fason.name}</h4>
                <p>Базовая цена: ${fason.price} сум</p>
                <label>
                    Размер:
                    <input type="text" id="size_${currentStep}" placeholder="Введите размер" required>
                </label>
                <div class="options">
                    <h5>Опции для ${fason.name}</h5>
                    <div class="option-group">
                        <label>
                            <input type="checkbox" id="addPocketA_${currentStep}" value="10000"> Добавить карман Накладной (+10 000 сум)
                        </label>
                        <label>
                            <input type="checkbox" id="addPocketB1_${currentStep}" value="15000"> Добавить карман Двухслойный (+15 000 сум)
                        </label>
                        <label>
                            <input type="checkbox" id="addPocketC_${currentStep}" value="20000"> Добавить карман Широкий (+20 000 сум)
                        </label>
                        <label>
                            <input type="checkbox" id="removePocketA_${currentStep}" value="-10000"> Убрать карман Накладной (-10 000 сум)
                        </label>
                        <label>
                            <input type="checkbox" id="removePocketB1_${currentStep}" value="-15000"> Убрать карман Двухслойный (-15 000 сум)
                        </label>
                        <label>
                            <input type="checkbox" id="removePocketC_${currentStep}" value="-20000"> Убрать карман Широкий (-20 000 сум)
                        </label>
                    </div>
                </div>
                <p><strong>Итого по фасону:</strong> <span id="fasonTotal_${currentStep}">${fason.price} сум</span></p>
            </div>
        `;

        stepContainer.appendChild(fasonDiv);

        // Добавляем обработчики событий для обновления итоговой суммы
        const optionCheckboxes = fasonDiv.querySelectorAll('input[type="checkbox"]');
        optionCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', updateTotal);
        });

        // Добавляем обработчик для изменения размера
        const sizeInput = fasonDiv.querySelector(`#size_${currentStep}`);
        if (sizeInput) {
            sizeInput.addEventListener('input', () => {
                fason.size = sizeInput.value.trim();
            });
        }
    } else {
        // Последний шаг: Ввод деталей клиента
        const clientDiv = document.createElement('div');
        clientDiv.classList.add('selected-fason');

        clientDiv.innerHTML = `
            <h4>Детали Заказа</h4>
            <label>
                Дата дедлайна:
                <input type="date" id="dateSelect" required>
            </label>
            <label>
                Имя клиента:
                <input type="text" id="clientName" required>
            </label>
            <label>
                Компания клиента:
                <input type="text" id="clientCompany">
            </label>
            <label>
                Телефон клиента:
                <input type="text" id="clientPhone" required>
            </label>
            <label>
                Примечание:
                <textarea id="notes"></textarea>
            </label>
            <label>
                Залог:
                <input type="number" id="depositAmount" min="0" value="0">
            </label>
            <p><strong>Итого к оплате:</strong> <span id="totalAmountDisplay">${calculateTotalAmount()} сум</span></p>
            <p><strong>Оставшаяся сумма:</strong> <span id="remainingAmountDisplay">${calculateTotalAmount()} сум</span></p>
        `;

        stepContainer.appendChild(clientDiv);

        // Добавляем обработчик события для обновления оставшейся суммы
        const depositInput = document.getElementById('depositAmount');
        if (depositInput) {
            depositInput.addEventListener('input', updateBalance);
        }
    }

    // Обновляем навигационные кнопки
    updateNavigationButtons();
}

// Функция обновления навигационных кнопок
function updateNavigationButtons() {
    const prevButton = document.getElementById('prevButton');
    const nextButton = document.getElementById('nextButton');

    if (!prevButton || !nextButton) {
        console.error('Навигационные кнопки не найдены');
        return;
    }

    // Устанавливаем состояние кнопки "Назад"
    prevButton.disabled = currentStep === 0;

    // Устанавливаем текст кнопки "Далее" или "Готово"
    nextButton.innerText = currentStep === selectedFasons.length ? 'Готово' : 'Далее';
}

// Функция перехода к следующему шагу
function nextStep() {
    // Валидация текущего шага
    if (currentStep < selectedFasons.length) {
        const sizeInput = document.getElementById(`size_${currentStep}`);
        if (sizeInput && sizeInput.value.trim() === '') {
            alert("Пожалуйста, введите размер.");
            return;
        } else {
            // Сохраняем размер в объекте фасона
            selectedFasons[currentStep].size = sizeInput.value.trim();
        }
    } else {
        // Валидация деталей клиента
        const clientName = document.getElementById('clientName');
        const clientPhone = document.getElementById('clientPhone');
        const dateSelect = document.getElementById('dateSelect');

        if (!clientName.value.trim() || !clientPhone.value.trim() || !dateSelect.value) {
            alert("Пожалуйста, заполните все обязательные поля.");
            return;
        }
    }

    // Переход к следующему шагу или завершение процесса
    if (currentStep < selectedFasons.length) {
        currentStep++;
        displayCurrentStep();
    } else {
        // Завершение процесса и генерация чека
        generateReceipt();
        closeModal();
    }
}

// Функция перехода к предыдущему шагу
function prevStep() {
    if (currentStep > 0) {
        currentStep--;
        displayCurrentStep();
    }
}

// Функция генерации чека и добавления его в Firebase
function generateReceipt() {
    const totalAmount = calculateTotalAmount();

    const depositAmountElement = document.getElementById('depositAmount');
    const depositAmount = depositAmountElement ? parseInt(depositAmountElement.value, 10) || 0 : 0;

    const notesElement = document.getElementById('notes');
    const notes = notesElement ? notesElement.value : '';

    const dateSelect = document.getElementById('dateSelect');
    const date = dateSelect ? dateSelect.value : '';

    const clientNameElement = document.getElementById('clientName');
    const clientName = clientNameElement ? clientNameElement.value : '';

    const clientCompanyElement = document.getElementById('clientCompany');
    const clientCompany = clientCompanyElement ? clientCompanyElement.value : '';

    const clientPhoneElement = document.getElementById('clientPhone');
    const clientPhone = clientPhoneElement ? clientPhoneElement.value : '';

    // Получаем выбранные фасоны с их индивидуальными опциями
    const formattedFasons = selectedFasons.map((fason, index) => {
        const size = fason.size || '';

        const options = getOptionsForFason(index);

        const optionsDetails = getOptionsDetails(options);

        const optionsTotal = optionsDetails.reduce((sum, option) => sum + option.value, 0);
        const total = fason.price + optionsTotal;

        return {
            name: fason.name,
            price: fason.price,
            image: fason.image,
            size: size,
            options: optionsDetails,
            total: total
        };
    });

    // Логирование для отладки
    console.log("Formatted Fasons:", formattedFasons);

    // Сохранение заказа в Firebase Realtime Database
    const ordersRef = ref(database, 'orders');
    const newOrderRef = push(ordersRef);
    set(newOrderRef, {
        fasons: formattedFasons,
        totalAmount: formattedFasons.reduce((sum, fason) => sum + fason.total, 0),
        depositAmount: depositAmount,
        color: '', // Если необходимо добавить выбор цвета, можно реализовать отдельный шаг
        notes: notes,
        date: date,
        clientName: clientName,
        clientCompany: clientCompany,
        clientPhone: clientPhone,
        timestamp: Date.now()
    })
    .then(() => {
        // Закрываем модальное окно и сбрасываем форму после успешного сохранения
        closeModal();
        // Снимаем выбор с чекбоксов в каталоге
        document.querySelectorAll('.selectFason:checked').forEach(checkbox => checkbox.checked = false);
        alert("Заказ успешно оформлен!");
    })
    .catch((error) => {
        alert("Ошибка при сохранении заказа: " + error.message);
    });
}

// Функция получения детальной информации об опциях
function getOptionsDetails(options) {
    const details = [];
    if (options.addPocketA !== 0) {
        details.push({ 
            name: options.addPocketA > 0 ? "Добавлен карман Накладной" : "Убран карман Накладной", 
            value: options.addPocketA 
        });
    }
    if (options.addPocketB1 !== 0) {
        details.push({ 
            name: options.addPocketB1 > 0 ? "Добавлен карман Двухслойный" : "Убран карман Двухслойный", 
            value: options.addPocketB1 
        });
    }
    if (options.addPocketC !== 0) {
        details.push({ 
            name: options.addPocketC > 0 ? "Добавлен карман Широкий" : "Убран карман Широкий", 
            value: options.addPocketC 
        });
    }
    return details;
}

// Функция расчета общей суммы
function calculateTotalAmount() {
    let total = 0;
    selectedFasons.forEach((fason, index) => {
        const options = getOptionsForFason(index);
        const optionsTotal = Object.values(options).reduce((sum, val) => sum + val, 0);
        const itemTotal = fason.price + optionsTotal;
        total += itemTotal;
    });

    return total;
}

// Функция получения опций для фасона
function getOptionsForFason(index) {
    const addPocketA = document.getElementById(`addPocketA_${index}`);
    const addPocketB1 = document.getElementById(`addPocketB1_${index}`);
    const addPocketC = document.getElementById(`addPocketC_${index}`);
    const removePocketA = document.getElementById(`removePocketA_${index}`);
    const removePocketB1 = document.getElementById(`removePocketB1_${index}`);
    const removePocketC = document.getElementById(`removePocketC_${index}`);

    return {
        addPocketA: addPocketA && addPocketA.checked ? parseInt(addPocketA.value, 10) : 0,
        addPocketB1: addPocketB1 && addPocketB1.checked ? parseInt(addPocketB1.value, 10) : 0,
        addPocketC: addPocketC && addPocketC.checked ? parseInt(addPocketC.value, 10) : 0,
        removePocketA: removePocketA && removePocketA.checked ? parseInt(removePocketA.value, 10) : 0,
        removePocketB1: removePocketB1 && removePocketB1.checked ? parseInt(removePocketB1.value, 10) : 0,
        removePocketC: removePocketC && removePocketC.checked ? parseInt(removePocketC.value, 10) : 0
    };
}

// Функция обновления итоговой суммы для текущего фасона
function updateTotal() {
    if (currentStep < selectedFasons.length) {
        const fason = selectedFasons[currentStep];
        const index = currentStep;

        const options = getOptionsForFason(index);
        const optionsTotal = Object.values(options).reduce((sum, val) => sum + val, 0);
        const total = fason.price + optionsTotal;

        const fasonTotalElement = document.getElementById(`fasonTotal_${index}`);
        if (fasonTotalElement) {
            fasonTotalElement.innerText = `${total} сум`;
        }

        // Обновляем общую сумму и оставшуюся сумму, если находимся на шаге деталей клиента
        const totalAmountDisplay = document.getElementById('totalAmountDisplay');
        if (totalAmountDisplay) {
            totalAmountDisplay.innerText = `${calculateTotalAmount()} сум`;
        }

        const remainingAmountDisplay = document.getElementById('remainingAmountDisplay');
        if (remainingAmountDisplay) {
            const depositInput = document.getElementById('depositAmount');
            const depositAmount = depositInput ? parseInt(depositInput.value, 10) || 0 : 0;
            remainingAmountDisplay.innerText = `${calculateTotalAmount() - depositAmount} сум`;
        }
    }
}

// Функция обновления оставшейся суммы
function updateBalance() {
    const totalAmount = calculateTotalAmount();
    const depositAmountElement = document.getElementById('depositAmount');
    const depositAmount = depositAmountElement ? parseInt(depositAmountElement.value, 10) || 0 : 0;
    const remainingAmount = totalAmount - depositAmount;

    const remainingAmountDisplay = document.getElementById('remainingAmountDisplay');
    if (remainingAmountDisplay) {
        remainingAmountDisplay.innerText = `${remainingAmount} сум`;
    }
}

// Функция создания и добавления чека в DOM с поддержкой нескольких фасонов
function renderReceipt(orderId, orderData) {
    const {
        fasons,
        totalAmount,
        depositAmount,
        color,
        notes,
        date,
        clientName,
        clientCompany,
        clientPhone,
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

    // Создаем HTML для списка фасонов
    let fasonsHTML = '';
    fasons.forEach(fason => {
        let optionsHTML = '';
        if (Array.isArray(fason.options) && fason.options.length > 0) {
            fason.options.forEach(option => {
                optionsHTML += `<p>${option.name} (${option.value > 0 ? '+' : ''}${option.value} сум)</p>`;
            });
        } else {
            optionsHTML = `<p>Нет дополнительных опций</p>`;
        }

        fasonsHTML += `
            <div class="receipt-fason">
                <img src="${fason.image}" alt="${fason.name}">
                <div class="receipt-fason-details">
                    <h4>${fason.name}</h4>
                    <p>Размер: ${fason.size}</p>
                    <p>Базовая цена: ${fason.price} сум</p>
                    <div class="fason-options">
                        ${optionsHTML}
                    </div>
                    <p><strong>Итого по фасону:</strong> ${fason.total} сум</p>
                </div>
            </div>
        `;
    });

    const receiptContent = `
        <div class="receipt-details">
            <h3>Чек №${orderId}</h3>
            <p><strong>Фасоны:</strong></p>
            <div class="fasons-container">
                ${fasonsHTML}
            </div>
            <p><strong>Общий цвет:</strong> ${color || 'Не выбран'}</p>
            ${notes ? `<p><strong>Примечание:</strong> ${notes}</p>` : ''}
            <p class="totalAmount"><strong>Итоговая сумма:</strong> ${totalAmount} сум</p>
            <p class="depositAmount"><strong>Залог:</strong> ${depositAmount} сум</p>
            <p><strong>Оставшаяся сумма:</strong> ${totalAmount - depositAmount} сум</p>
            <p><strong>Дата дедлайна:</strong> ${date}</p>
            <p><strong>Имя клиента:</strong> ${clientName}</p>
            <p><strong>Компания клиента:</strong> ${clientCompany || 'Не указано'}</p>
            <p><strong>Телефон клиента:</strong> ${clientPhone}</p>
            <div class="button-group">
                <button class="print-button">Распечатать</button>
                <button class="delete-button">Удалить</button>
            </div>
        </div>
    `;

    receiptElement.innerHTML = receiptContent;

    // Добавляем обработчики событий для кнопок чека
    const printButton = receiptElement.querySelector('.print-button');
    const deleteButton = receiptElement.querySelector('.delete-button');

    if (printButton) {
        printButton.addEventListener('click', () => printReceipt(printButton));
    }

    if (deleteButton) {
        deleteButton.addEventListener('click', () => deleteReceipt(orderId));
    }

    // Добавляем чек в секцию чеков
    const receiptsList = document.getElementById('receiptsList');
    if (receiptsList) {
        receiptsList.prepend(receiptElement);
    } else {
        console.error('Элемент с id "receiptsList" не найден');
    }
}

// Функция для печати чека
function printReceipt(button) {
    const receiptElement = button.closest('.receipt');
    if (!receiptElement) {
        console.error('Receipt элемент не найден');
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

    // Настраиваем стиль печати для уменьшения размера и обеспечения печати на одной странице
    const style = document.createElement('style');
    style.innerHTML = `
        @media print {
            @page {
                size: A4;
                margin: 10mm;
            }
            body {
                visibility: visible;
                margin: 0;
            }
            .receipt {
                width: 100%;
                padding: 0;
                margin: 0;
                box-sizing: border-box;
                overflow: hidden;
                page-break-after: avoid;
                box-shadow: none;
            }
            .button-group {
                display: none;
            }
            .receipt-fason img {
                width: 60px;
                height: 60px;
            }
            .receipt-details {
                font-size: 12px;
            }
            .receipt-fason-details h4 {
                font-size: 14px;
            }
            .receipt-fason-details p {
                font-size: 12px;
            }
            .receipt-details h3 {
                font-size: 16px;
            }
            .receipt-fason {
                page-break-inside: avoid;
            }
        }
    `;
    document.head.appendChild(style);

    window.print();

    // Восстанавливаем исходное содержимое страницы
    document.body.innerHTML = originalContents;
    document.head.removeChild(style);

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

// Функция поиска товаров (фасонов)
function searchItems() {
    const queryInput = document.getElementById('itemSearch');
    if (!queryInput) return;
    const query = queryInput.value.toLowerCase();
    const items = document.querySelectorAll('.catalog-items .item');

    items.forEach(item => {
        const titleElement = item.querySelector('.item-content h3');
        const descriptionElement = item.querySelector('.item-content p');
        const title = titleElement ? titleElement.innerText.toLowerCase() : '';
        const description = descriptionElement ? descriptionElement.innerText.toLowerCase() : '';
        if (title.includes(query) || description.includes(query)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

// Функция поиска чеков (заказов)
function searchReceipts() {
    const queryInput = document.getElementById('receiptSearch');
    if (!queryInput) return;
    const query = queryInput.value.toLowerCase();
    const receipts = document.querySelectorAll('.receipts-list .receipt');

    receipts.forEach(receipt => {
        const details = receipt.querySelector('.receipt-details');
        if (!details) return;
        const texts = Array.from(details.querySelectorAll('p')).map(p => p.innerText.toLowerCase()).join(' ');
        if (texts.includes(query)) {
            receipt.style.display = 'flex';
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
