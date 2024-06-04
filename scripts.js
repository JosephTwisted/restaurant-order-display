document.addEventListener('DOMContentLoaded', () => {
    const inProgressList = document.getElementById('in-progress-list');
    const completedList = document.getElementById('completed-list');
    const addOrderBtn = document.getElementById('add-order-btn');
    const orderReadyOverlay = document.getElementById('order-ready-overlay');
    const orderReadyContent = document.getElementById('order-ready-content');
    const videoContainer = document.getElementById('video-container');
    const prevArrow = document.getElementById('prev-arrow');
    const nextArrow = document.getElementById('next-arrow');

    let orderNumber = 1;
    const ordersInProgress = [];
    const completedOrders = [];

    function renderOrders() {
        inProgressList.innerHTML = '';
        completedList.innerHTML = '';

        ordersInProgress.forEach(order => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div class="order-number">#${String(order.number).padStart(3, '0')}</div>
                <div class="order-time">${order.timeLeft} min</div>
                <div class="order-status">Being Prepared</div>
            `;
            li.className = order.timeLeft === 0 ? 'pending' : '';
            li.addEventListener('click', () => completeOrder(order.number));
            inProgressList.appendChild(li);
        });

        completedOrders.forEach(order => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div class="order-number">#${String(order.number).padStart(3, '0')}</div>
                <div class="order-time">Ready</div>
                <div class="order-status">For Pickup</div>
            `;
            li.className = 'finished';
            li.addEventListener('click', () => removeOrder(order.number));
            completedList.appendChild(li);
        });
    }

    function updateOrderTimes() {
        ordersInProgress.forEach(order => {
            if (order.timeLeft > 0) {
                order.timeLeft -= 1;
            }
        });
        renderOrders();
    }

    setInterval(updateOrderTimes, 60000);

    addOrderBtn.addEventListener('click', () => {
        const timeOptions = [5, 10, 15, 20, 25, 30];
        const timeLeft = parseInt(prompt('Enter estimated time (5, 10, 15, 20, 25, 30 minutes):'));
        if (timeOptions.includes(timeLeft)) {
            ordersInProgress.push({ number: orderNumber++, timeLeft });
            renderOrders();
        } else {
            alert('Invalid time. Please enter one of the following: 5, 10, 15, 20, 25, 30 minutes.');
        }
    });

    function completeOrder(orderNumber) {
        const orderIndex = ordersInProgress.findIndex(order => order.number === orderNumber);
        if (orderIndex !== -1) {
            const [order] = ordersInProgress.splice(orderIndex, 1);
            completedOrders.push(order);
            showOrderReady(order.number);
            renderOrders();
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
            renderOrders();
        }
    }

    prevArrow.addEventListener('click', () => {
        inProgressList.scrollBy({
            left: -150,
            behavior: 'smooth'
        });
        completedList.scrollBy({
            left: -150,
            behavior: 'smooth'
        });
    });

    nextArrow.addEventListener('click', () => {
        inProgressList.scrollBy({
            left: 150,
            behavior: 'smooth'
        });
        completedList.scrollBy({
            left: 150,
            behavior: 'smooth'
        });
    });

    renderOrders();
});
