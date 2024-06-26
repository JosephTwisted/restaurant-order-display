document.addEventListener('DOMContentLoaded', () => {
    const ordersList = document.getElementById('orders-list');
    const addOrderBtn = document.getElementById('add-order-btn');
    const orderReadyOverlay = document.getElementById('order-ready-overlay');
    const orderReadyContent = document.getElementById('order-ready-content');
    const videoContainer = document.getElementById('video-container');
    const lastOrderNumberDisplay = document.getElementById('last-order-number');

    let orderNumber = 1;
    let ordersInProgress = [];
    let completedOrders = [];

    if (localStorage.getItem('ordersInProgress')) {
        ordersInProgress = JSON.parse(localStorage.getItem('ordersInProgress'));
    }
    if (localStorage.getItem('completedOrders')) {
        completedOrders = JSON.parse(localStorage.getItem('completedOrders'));
    }

    function saveOrders() {
        localStorage.setItem('ordersInProgress', JSON.stringify(ordersInProgress));
        localStorage.setItem('completedOrders', JSON.stringify(completedOrders));
    }

    function renderOrders() {
        ordersList.innerHTML = '';

        // Append completed orders first
        completedOrders.forEach(order => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div class="order-number">#${String(order.number).padStart(3, '0')}</div>
                <div class="order-time">Ready</div>
                <div class="order-status">For Pickup</div>
                <button class="edit-order-btn" onclick="editOrder(${order.number}, event)"></button>
            `;
            li.className = 'finished';
            li.addEventListener('click', () => removeOrder(order.number));
            ordersList.appendChild(li);
        });

        // Append in-progress orders
        ordersInProgress.forEach(order => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div class="order-number">#${String(order.number).padStart(3, '0')}</div>
                <div class="order-time">${order.timeLeft} min</div>
                <div class="order-status">Being Prepared</div>
                <button class="edit-order-btn" onclick="editOrder(${order.number}, event)"></button>
            `;
            li.className = 'preparing';
            li.addEventListener('click', () => completeOrder(order.number));
            ordersList.appendChild(li);
        });

        // Update the last order number display
        lastOrderNumberDisplay.textContent = orderNumber - 1;

        // Scroll to the first order
        ordersList.scrollTo(0, 0);
    }

    function updateOrderTimes() {
        ordersInProgress.forEach(order => {
            if (order.timeLeft > 0) {
                order.timeLeft -= 1;
            }
        });
        renderOrders();
        saveOrders();
    }

    setInterval(updateOrderTimes, 60000);

    function addOrder() {
        let lastOrderTime = 0;
        if (ordersInProgress.length > 0) {
            lastOrderTime = Math.max(...ordersInProgress.map(order => order.timeLeft));
        }
        let timeLeft = prompt('Enter estimated time in minutes (press Enter for automatic):');
        if (!timeLeft) {
            timeLeft = lastOrderTime + 5;
        } else {
            timeLeft = parseInt(timeLeft);
            if (isNaN(timeLeft) || timeLeft <= lastOrderTime) {
                alert(`Invalid time. Please enter a time greater than ${lastOrderTime} minutes.`);
                return;
            }
        }
        ordersInProgress.push({ number: orderNumber++, timeLeft });
        renderOrders();
        saveOrders();
    }

    window.completeOrder = function (orderNumber) {
        const orderIndex = ordersInProgress.findIndex(order => order.number === orderNumber);
        if (orderIndex !== -1) {
            const [order] = ordersInProgress.splice(orderIndex, 1);
            completedOrders.unshift(order);
            showOrderReady(order.number);
            renderOrders();
            saveOrders();
        }
    }

    window.showOrderReady = function (orderNumber) {
        const audio = new Audio('order-ready.mp3');
        audio.play();
        videoContainer.classList.add('blur');
        orderReadyContent.textContent = `Order #${String(orderNumber).padStart(3, '0')} is Ready!`;
        orderReadyOverlay.style.display = 'flex';
    }

    window.hideOrderReadyOverlay = function () {
        orderReadyOverlay.style.display = 'none';
        videoContainer.classList.remove('blur');
    }

    window.removeOrder = function (orderNumber) {
        const orderIndex = completedOrders.findIndex(order => order.number === orderNumber);
        if (orderIndex !== -1) {
            completedOrders.splice(orderIndex, 1);
            renderOrders();
            saveOrders();
        }
    }

    window.editOrder = function (orderNumber, event) {
        event.stopPropagation();  // Prevent triggering complete or remove on edit click
        const order = ordersInProgress.find(order => order.number === orderNumber) ||
            completedOrders.find(order => order.number === orderNumber);
        if (order) {
            const newTime = prompt('Enter new time in minutes (leave empty to cancel):', order.timeLeft);
            if (newTime !== null && newTime !== '') {
                const parsedTime = parseInt(newTime);
                if (!isNaN(parsedTime)) {
                    order.timeLeft = parsedTime;
                } else {
                    alert('Invalid time entered.');
                }
            } else if (newTime === '') {
                if (confirm('Are you sure you want to cancel this order?')) {
                    if (ordersInProgress.includes(order)) {
                        ordersInProgress = ordersInProgress.filter(o => o.number !== order.number);
                    } else {
                        completedOrders = completedOrders.filter(o => o.number !== order.number);
                    }

                    // Update the order number only if this was the last order
                    if (order.number === orderNumber - 1) {
                        orderNumber--;
                    }
                }
            }
            renderOrders();
            saveOrders();
        }
    }

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            hideOrderReadyOverlay();
        } else if (event.key === 'Enter') {
            addOrder();
        }
    });

    orderReadyOverlay.addEventListener('click', hideOrderReadyOverlay);

    renderOrders();
});
