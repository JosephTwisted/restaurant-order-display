document.addEventListener('DOMContentLoaded', () => {
    const ordersList = document.getElementById('orders-list');
    const addOrderBtn = document.getElementById('add-order-btn');
    const orderReadyOverlay = document.getElementById('order-ready-overlay');
    const orderReadyContent = document.getElementById('order-ready-content');
    const videoContainer = document.getElementById('video-container');

    const db = firebase.database().ref('orders');

    let orderNumber = 1;
    const ordersInProgress = [];
    const completedOrders = [];

    // Real-time listener for order updates
    db.on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            ordersInProgress.length = 0;
            completedOrders.length = 0;
            Object.values(data).forEach(order => {
                if (order.status === 'completed') {
                    completedOrders.push(order);
                } else {
                    ordersInProgress.push(order);
                }
            });
            renderOrders();
        }
    });

    function renderOrders() {
        ordersList.innerHTML = '';

        // Append completed orders first
        completedOrders.forEach(order => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div class="order-number">#${String(order.number).padStart(3, '0')}</div>
                <div class="order-time">Ready</div>
                <div class="order-status">For Pickup</div>
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
            `;
            li.className = 'preparing';
            li.addEventListener('click', () => completeOrder(order.number));
            ordersList.appendChild(li);
        });

        // Scroll to the first order
        ordersList.scrollTo(0, 0);
    }

    function updateOrderTimes() {
        ordersInProgress.forEach(order => {
            if (order.timeLeft > 0) {
                order.timeLeft -= 1;
                db.child(order.number).update({ timeLeft: order.timeLeft });
            }
        });
        renderOrders();
    }

    setInterval(updateOrderTimes, 60000);

    addOrderBtn.addEventListener('click', () => {
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
        const newOrder = { number: orderNumber++, timeLeft, status: 'in-progress' };
        ordersInProgress.push(newOrder);
        db.child(newOrder.number).set(newOrder);
    });

    function completeOrder(orderNumber) {
        const orderIndex = ordersInProgress.findIndex(order => order.number === orderNumber);
        if (orderIndex !== -1) {
            const [order] = ordersInProgress.splice(orderIndex, 1);
            order.status = 'completed';
            completedOrders.unshift(order);
            db.child(order.number).update({ status: 'completed', timeLeft: 0 });
            showOrderReady(order.number);
        }
    }

    function showOrderReady(orderNumber) {
        const audio = new Audio('order-ready.mp3');
        audio.play();
        videoContainer.classList.add('blur');
        orderReadyContent.textContent = `Order #${String(orderNumber).padStart(3, '0')} is Ready!`;
        orderReadyOverlay.style.display = 'flex';
        setTimeout(() => {
            orderReadyOverlay.style.display = 'none';
            videoContainer.classList.remove('blur');
        }, 3000);
    }

    function removeOrder(orderNumber) {
        const orderIndex = completedOrders.findIndex(order => order.number === orderNumber);
        if (orderIndex !== -1) {
            completedOrders.splice(orderIndex, 1);
            db.child(orderNumber).remove();
        }
    }

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            orderReadyOverlay.style.display = 'none';
            videoContainer.classList.remove('blur');
        }
    });

    renderOrders();
});
