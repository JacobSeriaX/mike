// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase, ref, push, set } from "firebase/database";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCDANEx7FB-U9Wj8ZItneroCA_sfmEUYAU",
  authDomain: "pechat-61e3f.firebaseapp.com",
  projectId: "pechat-61e3f",
  storageBucket: "pechat-61e3f.appspot.com",
  messagingSenderId: "33694902344",
  appId: "1:33694902344:web:43deb2fe82202bbf9a507d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

function openModal(fasonName, basePrice, imagePath) {
    document.getElementById('orderModal').style.display = 'block';
    document.getElementById('modalTitle').innerText = fasonName;
    document.getElementById('basePrice').innerText = `Базовая цена: ${basePrice} сум`;
    document.getElementById('totalAmount').innerText = basePrice;
    document.getElementById('fasonImagePath').value = imagePath; // Сохраняем путь к изображению для дальнейшего использования
    updateTotal();
}

function closeModal() {
    document.getElementById('orderModal').style.display = 'none';
    document.getElementById('orderForm').reset();
    document.getElementById('totalAmount').innerText = '0';
    document.getElementById('remainingAmount').innerText = '0';
}

function updateTotal() {
    const basePrice = parseInt(document.getElementById('basePrice').innerText.split(' ')[2]);
    let total = basePrice;

    const addPocket = document.getElementById('addPocket').checked ? parseInt(document.getElementById('addPocket').value) : 0;
    const addReflector = document.getElementById('addReflector').checked ? parseInt(document.getElementById('addReflector').value) : 0;
    const addFrontLogo = document.getElementById('addFrontLogo').checked ? parseInt(document.getElementById('addFrontLogo').value) : 0;
    const addBackLogo = document.getElementById('addBackLogo').checked ? parseInt(document.getElementById('addBackLogo').value) : 0;
    const addRibana = document.getElementById('addRibana').checked ? parseInt(document.getElementById('addRibana').value) : 0;

    total += addPocket + addReflector + addFrontLogo + addBackLogo + addRibana;

    document.getElementById('totalAmount').innerText = total;
    updateBalance();
}

function updateBalance() {
    const totalAmount = parseInt(document.getElementById('totalAmount').innerText);
    const depositAmount = parseInt(document.getElementById('depositAmount').value) || 0;
    const remainingAmount = totalAmount - depositAmount;
    document.getElementById('remainingAmount').innerText = remainingAmount;
}

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

    const addPocket = document.getElementById('addPocket').checked ? 'Добавлен карман (10 000 сум)' : '';
    const addReflector = document.getElementById('addReflector').checked ? 'Добавлен отражатель (10 000 сум)' : '';
    const addFrontLogo = document.getElementById('addFrontLogo').checked ? 'Добавлен логотип спереди (10 000 сум)' : '';
    const addBackLogo = document.getElementById('addBackLogo').checked ? 'Добавлен логотип сзади (10 000 сум)' : '';
    const addRibana = document.getElementById('addRibana').checked ? 'Добавлена рибана (10 000 сум)' : '';

    let receiptContent = `<p><strong>Фасон:</strong> ${fasonName}</p>`;
    receiptContent += `<img src="${fasonImagePath}" alt="${fasonName}" style="width: 100%; max-width: 300px; margin: 10px 0;">`;
    receiptContent += `<p class="total-amount"><strong>Итоговая сумма:</strong> ${totalAmount} сум</p>`;
    receiptContent += `<p class="deposit-amount"><strong>Залог:</strong> ${depositAmount} сум</p>`;
    if (color) {
        receiptContent += `<p><strong>Цвет:</strong> ${color}</p>`;
    }
    if (addPocket) receiptContent += `<p>${addPocket}</p>`;
    if (addReflector) receiptContent += `<p>${addReflector}</p>`;
    if (addFrontLogo) receiptContent += `<p>${addFrontLogo}</p>`;
    if (addBackLogo) receiptContent += `<p>${addBackLogo}</p>`;
    if (addRibana) receiptContent += `<p>${addRibana}</p>`;
    if (notes) {
        receiptContent += `<p><strong>Примечание:</strong> ${notes}</p>`;
    }
    receiptContent += `<p><strong>Дата:</strong> ${date}</p>`;
    receiptContent += `<p><strong>Имя клиента:</strong> ${clientName}</p>`;
    receiptContent += `<p><strong>Компания клиента:</strong> ${clientCompany}</p>`;
    receiptContent += `<p><strong>Телефон клиента:</strong> ${clientPhone}</p>`;

    document.getElementById('receiptContent').innerHTML = receiptContent;
    document.getElementById('receipt').style.display = 'block';
    closeModal();

    // Save order to Firebase Realtime Database
    const db = getDatabase();
    const ordersRef = ref(db, 'orders');
    const newOrderRef = push(ordersRef);
    set(newOrderRef, {
        fasonName: fasonName,
        totalAmount: totalAmount,
        depositAmount: depositAmount,
        color: color,
        notes: notes,
        date: date,
        clientName: clientName,
        clientCompany: clientCompany,
        clientPhone: clientPhone,
        addPocket: addPocket !== '' ? true : false,
        addReflector: addReflector !== '' ? true : false,
        addFrontLogo: addFrontLogo !== '' ? true : false,
        addBackLogo: addBackLogo !== '' ? true : false,
        addRibana: addRibana !== '' ? true : false,
        fasonImagePath: fasonImagePath
    });
}

function printReceipt() {
    const receiptElement = document.getElementById('receipt');
    const totalAmountElement = receiptElement.querySelector('.total-amount');
    const depositAmountElement = receiptElement.querySelector('.deposit-amount');

    // Скрываем итоговую сумму и залог перед печатью
    if (totalAmountElement) totalAmountElement.style.display = 'none';
    if (depositAmountElement) depositAmountElement.style.display = 'none';

    const printContents = receiptElement.innerHTML;
    const originalContents = document.body.innerHTML;

    document.body.innerHTML = printContents;
    window.print();
    document.body.innerHTML = originalContents;

    // Восстанавливаем отображение итоговой суммы и залога
    if (totalAmountElement) totalAmountElement.style.display = 'block';
    if (depositAmountElement) depositAmountElement.style.display = 'block';
}