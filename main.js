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

// Конфигурация Firebase (замените на ваши реальные данные)
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

// Предопределённые размеры
const predefinedSizes = [44, 46, 48, 50, 52, 54, 56, 58, 60];

// Определение типов карманов и их стоимости
const pocketTypes = {
    addPocketC: { name: "Добавлен карман Широкий", price: 2000 },
    removePocketA: { name: "Убран карман Накладной", price: -1500 },
    removePocketB1: { name: "Убран карман Двухслойный", price: -1800 }
    // Добавьте другие типы карманов по необходимости
};

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
        image: checkbox.dataset.image,
        sizes: [] // Массив для выбранных размеров
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

        // Создаём элемент для текущего шага
        const fasonDiv = document.createElement('div');
        fasonDiv.classList.add('selected-fason');

        fasonDiv.innerHTML = `
            <img src="${fason.image}" alt="${fason.name}" class="selected-fason-img">
            <div class="selected-fason-details">
                <h4>${fason.name}</h4>
                <p>Базовая цена: ${fason.price} сум</p>
                <div class="size-selection">
                    <h5>Выберите размеры, количество, цвет и карманы для ${fason.name}</h5>
                    ${generateSizeOptions(currentStep)}
                </div>
                <p><strong>Итого по фасону:</strong> <span id="fasonTotal_${currentStep}">${fason.price} сум</span></p>
            </div>
        `;

        stepContainer.appendChild(fasonDiv);

        // Добавляем обработчики событий для изменения состояния полей при выборе размера
        const sizeCheckboxes = fasonDiv.querySelectorAll('.sizeCheckbox');
        sizeCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (event) => {
                handleSizeCheckboxChange(event, currentStep);
                updateTotal();
            });
        });

        // Добавляем обработчики событий для ввода количества, выбора цвета и изменения карманов
        const quantityInputs = fasonDiv.querySelectorAll('.sizeQuantity');
        quantityInputs.forEach(input => {
            input.addEventListener('input', (event) => {
                handleQuantityChange(event, currentStep);
                updateTotal();
            });
        });

        const colorSelectors = fasonDiv.querySelectorAll('.sizeColor');
        colorSelectors.forEach(select => {
            select.addEventListener('change', (event) => {
                handleColorChange(event, currentStep);
                updateTotal();
            });
        });

        const pocketIncreaseButtons = fasonDiv.querySelectorAll('.increasePocket');
        const pocketDecreaseButtons = fasonDiv.querySelectorAll('.decreasePocket');

        pocketIncreaseButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                handlePocketChange(event, currentStep, 1);
                updateTotal();
            });
        });

        pocketDecreaseButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                handlePocketChange(event, currentStep, -1);
                updateTotal();
            });
        });
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

// Функция генерации HTML для выбора размеров
function generateSizeOptions(stepIndex) {
    let sizeOptionsHTML = '';
    predefinedSizes.forEach(size => {
        sizeOptionsHTML += `
            <div class="size-option">
                <label>
                    <input type="checkbox" class="sizeCheckbox" data-size="${size}">
                    Размер ${size}
                </label>
                <label>
                    Количество:
                    <input type="number" class="sizeQuantity" data-size="${size}" min="1" value="1" disabled>
                </label>
                <label>
                    Цвет:
                    <select class="sizeColor" data-size="${size}" disabled>
                        <option value="">Выберите цвет</option>
                        <option value="Красный">Красный</option>
                        <option value="Синий">Синий</option>
                        <option value="Зелёный">Зелёный</option>
                        <option value="Чёрный">Чёрный</option>
                        <option value="Белый">Белый</option>
                        <!-- Добавьте другие цвета по необходимости -->
                    </select>
                </label>
                <label>
                    Карманы:
                    <div class="pocket-controls">
                        ${generatePocketControls(size)}
                    </div>
                </label>
            </div>
        `;
    });
    return sizeOptionsHTML;
}

// Функция генерации элементов управления карманами для каждого типа
function generatePocketControls(size) {
    let controlsHTML = '';
    for (let pocketType in pocketTypes) {
        controlsHTML += `
            <div class="single-pocket-control">
                <span>${pocketTypes[pocketType].name}:</span>
                <button type="button" class="decreasePocket" data-size="${size}" data-pocket-type="${pocketType}">-</button>
                <span class="pocketCount" data-size="${size}" data-pocket-type="${pocketType}">0</span>
                <button type="button" class="increasePocket" data-size="${size}" data-pocket-type="${pocketType}">+</button>
            </div>
        `;
    }
    return controlsHTML;
}

// Функция обработки изменения состояния чекбокса размера
function handleSizeCheckboxChange(event, stepIndex) {
    const checkbox = event.target;
    const size = parseInt(checkbox.dataset.size, 10);
    const fason = selectedFasons[stepIndex];

    // Найти соответствующие элементы ввода количества, выбора цвета и карманов
    const fasonDiv = document.querySelector(`#stepContainer .selected-fason`);
    if (!fasonDiv) return;

    const quantityInput = fasonDiv.querySelector(`.sizeQuantity[data-size="${size}"]`);
    const colorSelect = fasonDiv.querySelector(`.sizeColor[data-size="${size}"]`);
    const pocketCountSpans = fasonDiv.querySelectorAll(`.pocketCount[data-size="${size}"]`);

    if (checkbox.checked) {
        // Включить поля ввода
        if (quantityInput) {
            quantityInput.disabled = false;
            quantityInput.value = 1; // Установить значение по умолчанию
        }
        if (colorSelect) {
            colorSelect.disabled = false;
            colorSelect.value = ''; // Сбросить выбор цвета
        }

        // Добавить размер в массив фасона, если его ещё нет
        if (!fason.sizes.some(s => s.size === size)) {
            fason.sizes.push({
                size: size,
                quantity: 1,
                color: '',
                pockets: { ...initializePocketCounts() }
            });
        }
    } else {
        // Отключить и очистить поля ввода
        if (quantityInput) {
            quantityInput.disabled = true;
            quantityInput.value = 1;
        }
        if (colorSelect) {
            colorSelect.disabled = true;
            colorSelect.value = '';
        }
        if (pocketCountSpans) {
            pocketCountSpans.forEach(span => span.innerText = '0');
        }

        // Удалить размер из массива фасона
        fason.sizes = fason.sizes.filter(s => s.size !== size);
    }
}

// Функция инициализации количества карманов для всех типов
function initializePocketCounts() {
    let counts = {};
    for (let type in pocketTypes) {
        counts[type] = 0;
    }
    return counts;
}

// Функция обработки изменения количества
function handleQuantityChange(event, stepIndex) {
    const input = event.target;
    const size = parseInt(input.dataset.size, 10);
    const fason = selectedFasons[stepIndex];
    const newQuantity = parseInt(input.value, 10);

    // Найти соответствующий объект размера
    const sizeObj = fason.sizes.find(s => s.size === size);
    if (sizeObj) {
        sizeObj.quantity = isNaN(newQuantity) || newQuantity < 1 ? 1 : newQuantity;
    }
}

// Функция обработки изменения цвета
function handleColorChange(event, stepIndex) {
    const select = event.target;
    const size = parseInt(select.dataset.size, 10);
    const fason = selectedFasons[stepIndex];
    const selectedColor = select.value;

    // Найти соответствующий объект размера
    const sizeObj = fason.sizes.find(s => s.size === size);
    if (sizeObj) {
        sizeObj.color = selectedColor;
    }
}

// Функция обработки изменения количества карманов
function handlePocketChange(event, stepIndex, delta) {
    const button = event.target;
    const size = parseInt(button.dataset.size, 10);
    const pocketType = button.dataset.pocketType; // Тип кармана, который изменяется
    const fason = selectedFasons[stepIndex];

    // Найти соответствующий объект размера
    const sizeObj = fason.sizes.find(s => s.size === size);
    if (sizeObj && pocketType && pocketTypes.hasOwnProperty(pocketType)) {
        sizeObj.pockets[pocketType] += delta;
        if (sizeObj.pockets[pocketType] < 0) sizeObj.pockets[pocketType] = 0;

        // Обновить отображение количества карманов
        const fasonDiv = document.querySelector(`#stepContainer .selected-fason`);
        if (fasonDiv) {
            const pocketCountSpan = fasonDiv.querySelector(`.pocketCount[data-size="${size}"][data-pocket-type="${pocketType}"]`);
            if (pocketCountSpan) {
                pocketCountSpan.innerText = sizeObj.pockets[pocketType];
            }
        }
    }
}

// Функция обновления итоговой суммы
function updateTotal() {
    let total = 0;
    selectedFasons.forEach(fason => {
        if (fason.sizes && fason.sizes.length > 0) {
            fason.sizes.forEach(sizeObj => {
                total += fason.price * sizeObj.quantity;
                for (let pocketType in sizeObj.pockets) {
                    if (pocketTypes[pocketType]) {
                        total += pocketTypes[pocketType].price * sizeObj.pockets[pocketType];
                    }
                }
            });
        }
    });

    // Обновляем отображение общей суммы
    const totalAmountDisplay = document.getElementById('totalAmountDisplay');
    if (totalAmountDisplay) {
        totalAmountDisplay.innerText = `${total} сум`;
    }

    // Обновляем оставшуюся сумму, учитывая залог
    const remainingAmountDisplay = document.getElementById('remainingAmountDisplay');
    if (remainingAmountDisplay) {
        const depositInput = document.getElementById('depositAmount');
        const depositAmount = depositInput ? parseInt(depositInput.value, 10) || 0 : 0;
        remainingAmountDisplay.innerText = `${total - depositAmount} сум`;
    }

    // Обновляем итоговую сумму по каждому фасону
    selectedFasons.forEach((fason, index) => {
        let fasonTotal = 0;
        if (fason.sizes && fason.sizes.length > 0) {
            fason.sizes.forEach(sizeObj => {
                fasonTotal += fason.price * sizeObj.quantity;
                for (let pocketType in sizeObj.pockets) {
                    if (pocketTypes[pocketType]) {
                        fasonTotal += pocketTypes[pocketType].price * sizeObj.pockets[pocketType];
                    }
                }
            });
        }
        const fasonTotalElement = document.getElementById(`fasonTotal_${index}`);
        if (fasonTotalElement) {
            fasonTotalElement.innerText = `${fasonTotal} сум`;
        }
    });
}

// Функция расчёта общей суммы
function calculateTotalAmount() {
    let total = 0;
    selectedFasons.forEach(fason => {
        if (fason.sizes && fason.sizes.length > 0) {
            fason.sizes.forEach(sizeObj => {
                total += fason.price * sizeObj.quantity;
                for (let pocketType in sizeObj.pockets) {
                    if (pocketTypes[pocketType]) {
                        total += pocketTypes[pocketType].price * sizeObj.pockets[pocketType];
                    }
                }
            });
        }
    });

    return total;
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

// Функция перехода к следующему шагу
function nextStep() {
    // Валидация текущего шага
    if (currentStep < selectedFasons.length) {
        const fason = selectedFasons[currentStep];
        if (fason.sizes.length === 0) {
            alert("Пожалуйста, выберите хотя бы один размер для фасона.");
            return;
        }

        // Проверка заполненности количеств, цветов и карманов
        for (let sizeObj of fason.sizes) {
            if (!sizeObj.quantity || sizeObj.quantity < 1) {
                alert(`Пожалуйста, укажите корректное количество для размера ${sizeObj.size}.`);
                return;
            }
            if (!sizeObj.color) {
                alert(`Пожалуйста, выберите цвет для размера ${sizeObj.size}.`);
                return;
            }
            for (let pocketType in sizeObj.pockets) {
                if (sizeObj.pockets[pocketType] < 0) {
                    alert(`Количество карманов (${pocketTypes[pocketType].name}) для размера ${sizeObj.size} не может быть отрицательным.`);
                    return;
                }
            }
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

    // Получаем выбранные фасоны с их индивидуальными размерами и параметрами
    const formattedFasons = selectedFasons.map((fason, index) => {
        const sizes = fason.sizes || [];

        const formattedSizes = sizes.map(sizeObj => {
            let details = [];

            // Добавление деталей карманов
            for (let pocketType in sizeObj.pockets) {
                if (sizeObj.pockets[pocketType] !== 0) {
                    details.push({
                        name: pocketTypes[pocketType].name,
                        value: sizeObj.pockets[pocketType]
                    });
                }
            }

            return {
                size: sizeObj.size,
                quantity: sizeObj.quantity,
                color: sizeObj.color,
                pockets: details
            };
        });

        return {
            name: fason.name,
            price: fason.price,
            image: fason.image,
            sizes: formattedSizes
        };
    });

    // Сохранение заказа в Firebase Realtime Database
    const ordersRef = ref(database, 'orders');
    const newOrderRef = push(ordersRef);
    set(newOrderRef, {
        fasons: formattedFasons,
        totalAmount: totalAmount,
        depositAmount: depositAmount,
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

// Функция создания и добавления чека в DOM с поддержкой нескольких фасонов и размеров
function renderReceipt(orderId, orderData) {
    const {
        fasons,
        totalAmount,
        depositAmount,
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

    // Создаём новый элемент чека
    const receiptElement = document.createElement('div');
    receiptElement.classList.add('receipt');
    if (blinkClass) {
        receiptElement.classList.add(blinkClass);
    }
    receiptElement.setAttribute('data-id', orderId); // Добавляем атрибут с ID заказа

    // Создаём HTML для списка фасонов
    let fasonsHTML = '';
    fasons.forEach(fason => {
        let sizesHTML = '';
        if (Array.isArray(fason.sizes) && fason.sizes.length > 0) {
            fason.sizes.forEach(sizeObj => {
                let pocketsHTML = '';
                if (Array.isArray(sizeObj.pockets) && sizeObj.pockets.length > 0) {
                    sizeObj.pockets.forEach(pocket => {
                        pocketsHTML += `<li>${pocket.name}: ${pocket.value}</li>`;
                    });
                } else {
                    pocketsHTML = '<li>Нет изменений карманов</li>';
                }

                sizesHTML += `
                    <div class="receipt-size">
                        <p><strong>Размер:</strong> ${sizeObj.size}</p>
                        <p><strong>Количество:</strong> ${sizeObj.quantity}</p>
                        <p><strong>Цвет:</strong> ${sizeObj.color}</p>
                        <p><strong>Карманы:</strong></p>
                        <ul>
                            ${pocketsHTML}
                        </ul>
                    </div>
                `;
            });
        } else {
            sizesHTML = '<p>Нет выбранных размеров</p>';
        }

        // Рассчитываем итоговую сумму по фасону
        const fasonTotal = fason.sizes.reduce((sum, s) => {
            let sumPockets = 0;
            if (Array.isArray(s.pockets)) {
                s.pockets.forEach(pocket => {
                    const pocketKey = pocketTypeKey(pocket.name);
                    if (pocketKey && pocketTypes[pocketKey]) {
                        sumPockets += pocket.value * pocketTypes[pocketKey].price;
                    }
                });
            }
            return sum + (s.quantity * fason.price) + sumPockets;
        }, 0);

        fasonsHTML += `
            <div class="receipt-fason">
                <img src="${fason.image}" alt="${fason.name}">
                <div class="receipt-fason-details">
                    <h4>${fason.name}</h4>
                    <div class="fason-sizes">
                        ${sizesHTML}
                    </div>
                    <p><strong>Итого по фасону:</strong> ${fasonTotal} сум</p>
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
            ${notes ? `<p><strong>Примечание:</strong> ${notes}</p>` : ''}
            <p class="totalAmount"><strong>Итого к оплате:</strong> ${totalAmount} сум</p>
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

// Функция для получения ключа кармана по названию
function pocketTypeKey(name) {
    for (let key in pocketTypes) {
        if (pocketTypes[key].name === name) {
            return key;
        }
    }
    return null;
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
            .receipt-fason-details p, .receipt-fason-details li {
                font-size: 12px;
            }
            .receipt-details h3 {
                font-size: 16px;
            }
            ul {
                list-style-type: disc;
                margin-left: 20px;
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

// Функция для расчёта разницы в днях между двумя датами
function calculateDaysRemaining(deadlineDate) {
    const currentDate = new Date();
    const deadline = new Date(deadlineDate);

    // Сброс времени до полуночи для точного расчёта дней
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
        const texts = Array.from(details.querySelectorAll('p, li')).map(p => p.innerText.toLowerCase()).join(' ');
        if (texts.includes(query)) {
            receipt.style.display = 'flex';
        } else {
            receipt.style.display = 'none';
        }
    });
}

// Установка слушателей для новых и удалённых заказов
const ordersRef = ref(database, 'orders');
onChildAdded(ordersRef, (data) => {
    renderReceipt(data.key, data.val());
});

onChildRemoved(ordersRef, (data) => {
    const receiptToRemove = document.querySelector(`.receipt[data-id="${data.key}"]`);
    if (receiptToRemove) {
        receiptToRemove.remove();
    }
});
