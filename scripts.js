document.addEventListener('DOMContentLoaded', () => {
    const ordersList = document.getElementById('orders-list');
    const orderReadyOverlay = document.getElementById('order-ready-overlay');
    const orderReadyContent = document.getElementById('order-ready-content');
    const videoContainer = document.getElementById('video-container');

    const db = firebase.database().ref('orders');

    let orderNumber = 1;
    const ordersInProgress = [];
    const completedOrders = [];

    // Fetch initial data
    db.on('value', (snapshot) => {
        const data = snapshot.val();
        ordersInProgress.length = 0;
        completedOrders.length = 0;
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
            ordersList.appendChild(li);
        });

        // Scroll to the first order
        ordersList.scrollTo(0, 0);
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

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            orderReadyOverlay.style.display = 'none';
            videoContainer.classList.remove('blur');
        }
    });

    renderOrders();
});
