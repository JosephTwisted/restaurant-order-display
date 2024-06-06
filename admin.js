document.addEventListener('DOMContentLoaded', () => {
    const ordersList = document.getElementById('orders-list');
    const addOrderBtn = document.getElementById('add-order-btn');
    const refreshOrdersBtn = document.getElementById('refresh-orders-btn');
    const searchOrders = document.getElementById('search-orders');
    const filterStatus = document.getElementById('filter-status');
    const orderModal = document.getElementById('order-modal');
    const newOrderForm = document.getElementById('new-order-form');
    const closeModal = document.querySelectorAll('.close');
    const historyList = document.getElementById('history-list');
    const settingsLink = document.getElementById('settings-link');
    const settingsModal = document.getElementById('settings-modal');
    const settingsClose = settingsModal.querySelector('.close');
    const settingsForm = document.getElementById('settings-form');
    const totalAmount = document.getElementById('total-amount');
    const orderSummary = document.getElementById('order-summary');
    const orderDetailModal = document.getElementById('order-detail-modal');
    const orderDetailContent = document.getElementById('order-detail-content');
    const loadingIndicator = document.getElementById('loading-indicator');

    const db = firebase.database().ref('orders');
    const historyDb = firebase.database().ref('orderHistory');
    const settingsDb = firebase.database().ref('settings');

    let orderNumber = 1;
    const ordersInProgress = [];
    const completedOrders = [];
    const orderHistory = [];
    let orderDetails = {};
    let prices = {
        "Pulled Pork": 9.00,
        "Pulled Chicken": 9.00,
        "Pulled Beef": 10.00,
        "Beef Brisket": 13.50,
        "Vegan Burger": 12.00,
        "Classic Fries": 3.50,
        "Cheesy Fries": 4.50,
        "Gluten Free Bun": 1.00,
        "Soft Drink": 3.00,
        "Water": 2.00,
        "Energy Drink": 4.00,
        "Specials": 5.00
    };

    function showLoadingIndicator() {
        loadingIndicator.style.display = 'block';
    }

    function hideLoadingIndicator() {
        loadingIndicator.style.display = 'none';
    }

    function fetchOrders() {
        showLoadingIndicator();
        ordersList.innerHTML = '';
        ordersInProgress.length = 0;
        completedOrders.length = 0;

        db.once('value', (snapshot) => {
            const data = snapshot.val();
            if (data) {
                Object.values(data).forEach(order => {
                    if (order.status === 'completed') {
                        completedOrders.push(order);
                    } else {
                        ordersInProgress.push(order);
                    }
                    // Update orderNumber to ensure it keeps incrementing
                    if (order.number >= orderNumber) {
                        orderNumber = order.number + 1;
                    }
                });
                renderOrders();
                hideLoadingIndicator();
            }
        });

        historyDb.once('value', (snapshot) => {
            const data = snapshot.val();
            if (data) {
                orderHistory.length = 0;
                Object.values(data).forEach(order => orderHistory.push(order));
                renderHistory();
            }
        });

        settingsDb.once('value', (snapshot) => {
            const data = snapshot.val();
            if (data) {
                prices = data.prices;
            }
        });
    }

    function renderOrders() {
        ordersList.innerHTML = '';

        const filteredOrders = [...completedOrders, ...ordersInProgress].filter(order => {
            if (filterStatus.value && order.status !== filterStatus.value) {
                return false;
            }
            if (searchOrders.value && !JSON.stringify(order).toLowerCase().includes(searchOrders.value.toLowerCase())) {
                return false;
            }
            return true;
        });

        filteredOrders.forEach(order => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div class="order-number" onclick="viewOrderDetails(${order.number})">#${String(order.number).padStart(3, '0')}</div>
                <div class="order-time">${order.timeLeft || 'Ready'} min</div>
                <div class="order-status">${order.status.replace('-', ' ')}</div>
                <button onclick="editOrder(${order.number})">Edit</button>
                <button onclick="removeOrder(${order.number})">Remove</button>
            `;
            li.className = order.status === 'completed' ? 'finished' : 'preparing';
            ordersList.appendChild(li);
        });
    }

    function renderHistory() {
        historyList.innerHTML = '';
        orderHistory.forEach(order => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div class="order-number" onclick="viewOrderDetails(${order.number})">#${String(order.number).padStart(3, '0')}</div>
                <div class="order-time">${order.timeLeft || 'Ready'} min</div>
                <div class="order-status">${order.status.replace('-', ' ')}</div>
                <div class="order-details">${order.details}</div>
                <div class="order-timestamp">${order.timestamp}</div>
            `;
            historyList.appendChild(li);
        });
    }

    addOrderBtn.addEventListener('click', () => {
        orderModal.style.display = 'block';
    });

    settingsLink.addEventListener('click', () => {
        settingsModal.style.display = 'block';
    });

    closeModal.forEach(modalClose => {
        modalClose.onclick = () => {
            modalClose.closest('.modal').style.display = 'none';
        }
    });

    window.onclick = (event) => {
        if (event.target === orderModal) {
            orderModal.style.display = 'none';
        }
        if (event.target === settingsModal) {
            settingsModal.style.display = 'none';
        }
        if (event.target === orderDetailModal) {
            orderDetailModal.style.display = 'none';
        }
    };

    newOrderForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const timeLeft = document.getElementById('order-time').value;
        const details = JSON.stringify(orderDetails);
        const timestamp = new Date().toISOString();
        const newOrder = { number: orderNumber++, timeLeft, status: 'in-progress', details, timestamp };
        ordersInProgress.push(newOrder);
        db.child(newOrder.number).set(newOrder);
        orderDetails = {};
        renderOrders();
        orderModal.style.display = 'none';
    });

    settingsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(settingsForm);
        const newPrices = {};
        formData.forEach((value, key) => {
            const itemName = key.replace('price', '');
            newPrices[itemName] = parseFloat(value);
        });
        prices = newPrices;
        settingsDb.set({ prices });
        settingsModal.style.display = 'none';
    });

    document.querySelectorAll('.item-btn').forEach(button => {
        button.addEventListener('click', () => {
            const category = button.getAttribute('data-category');
            const item = button.getAttribute('data-item');
            const price = parseFloat(button.getAttribute('data-price'));

            if (!orderDetails[item]) {
                orderDetails[item] = { quantity: 0, price: price };
            }
            orderDetails[item].quantity += 1;

            renderOrderSummary();
        });
    });

    function renderOrderSummary() {
        orderSummary.innerHTML = '';
        let total = 0;

        Object.keys(orderDetails).forEach(item => {
            const { quantity, price } = orderDetails[item];
            total += quantity * price;

            const div = document.createElement('div');
            div.className = 'order-summary-item';
            div.innerHTML = `
                ${item}: ${quantity} x €${price.toFixed(2)} = €${(quantity * price).toFixed(2)}
                <button type="button" onclick="decreaseQuantity('${item}')">-</button>
                <button type="button" onclick="increaseQuantity('${item}')">+</button>
                <button type="button" onclick="removeItem('${item}')">Remove</button>
            `;
            orderSummary.appendChild(div);
        });

        totalAmount.textContent = total.toFixed(2);
    }

    window.decreaseQuantity = (item) => {
        if (orderDetails[item].quantity > 0) {
            orderDetails[item].quantity -= 1;
            if (orderDetails[item].quantity === 0) {
                delete orderDetails[item];
            }
            renderOrderSummary();
        }
    };

    window.increaseQuantity = (item) => {
        orderDetails[item].quantity += 1;
        renderOrderSummary();
    };

    window.removeItem = (item) => {
        delete orderDetails[item];
        renderOrderSummary();
    };

    window.completeOrder = (orderNumber) => {
        const orderIndex = ordersInProgress.findIndex(order => order.number === orderNumber);
        if (orderIndex !== -1) {
            const [order] = ordersInProgress.splice(orderIndex, 1);
            order.status = 'completed';
            completedOrders.unshift(order);
            db.child(order.number).update({ status: 'completed', timeLeft: 0 });
            renderOrders();
        }
    };

    window.removeOrder = (orderNumber) => {
        const orderIndex = ordersInProgress.findIndex(order => order.number === orderNumber);
        if (orderIndex !== -1) {
            ordersInProgress.splice(orderIndex, 1);
        } else {
            const completedOrderIndex = completedOrders.findIndex(order => order.number === orderNumber);
            if (completedOrderIndex !== -1) {
                completedOrders.splice(completedOrderIndex, 1);
            }
        }
        db.child(orderNumber).remove();
        renderOrders();
    };

    window.editOrder = (orderNumber) => {
        const orderIndex = ordersInProgress.findIndex(order => order.number === orderNumber);
        if (orderIndex !== -1) {
            const order = ordersInProgress[orderIndex];
            orderModal.style.display = 'block';
            // Populate modal with order details for editing
        }
    };

    window.viewOrderDetails = (orderNumber) => {
        const orderIndex = ordersInProgress.findIndex(order => order.number === orderNumber);
        const order = ordersInProgress[orderIndex] || completedOrders.find(order => order.number === orderNumber);
        if (order) {
            orderDetailContent.innerHTML = `
                <h2>Order #${String(order.number).padStart(3, '0')}</h2>
                <p>Status: ${order.status.replace('-', ' ')}</p>
                <p>Time Left: ${order.timeLeft || 'Ready'} min</p>
                <p>Details: ${order.details}</p>
                <p>Timestamp: ${order.timestamp}</p>
            `;
            orderDetailModal.style.display = 'block';
        }
    };

    fetchOrders();
});
