// Firebase configuration
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

document.addEventListener('DOMContentLoaded', () => {
    const ordersList = document.getElementById('orders-list');
    const addOrderBtn = document.getElementById('add-order-btn');
    const orderReadyOverlay = document.getElementById('order-ready-overlay');
    const orderReadyContent = document.getElementById('order-ready-content');
    const videoContainer = document.getElementById('video-container');

    function fetchOrders() {
        db.collection("orders").orderBy("number").onSnapshot((querySnapshot) => {
            const orders = [];
            querySnapshot.forEach((doc) => {
                orders.push(doc.data());
            });
            renderOrders(orders);
        });
    }

    function renderOrders(orders) {
        ordersList.innerHTML = '';

        // Append orders
        orders.forEach(order => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div class="order-number">#${String(order.number).padStart(3, '0')}</div>
                <div class="order-time">${order.status === 'Being Prepared' ? order.timeLeft + ' min' : 'Ready'}</div>
                <div class="order-status">${order.status}</div>
            `;
            li.className = order.status === 'Being Prepared' ? 'preparing' : 'finished';
            li.addEventListener('click', () => {
                if (order.status === 'Being Prepared') {
                    completeOrder(order.number);
                } else {
                    removeOrder(order.number);
                }
            });
            ordersList.appendChild(li);
        });
    }

    function addOrder(timeLeft) {
        const orderNumber = Date.now();
        db.collection("orders").add({
            number: orderNumber,
            timeLeft: timeLeft,
            status: 'Being Prepared'
        });
    }

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
        addOrder(timeLeft);
    });

    function completeOrder(orderNumber) {
        db.collection("orders").where("number", "==", orderNumber).get()
            .then(querySnapshot => {
                querySnapshot.forEach(doc => {
                    doc.ref.update({ status: 'Ready for Pickup' });
                });
            });
    }

    function showOrderReady(orderNumber) {
        const audio = new Audio('order-ready.mp3');
        audio.play();
        videoContainer.classList.add('blur');
        orderReadyContent.textContent = `Order #${String(orderNumber).padStart(3, '0')} is Ready!`;
        orderReadyOverlay.style.display = 'flex';
    }

    function hideOrderReadyOverlay() {
        orderReadyOverlay.style.display = 'none';
        videoContainer.classList.remove('blur');
    }

    function removeOrder(orderNumber) {
        db.collection("orders").where("number", "==", orderNumber).get()
            .then(querySnapshot => {
                querySnapshot.forEach(doc => {
                    doc.ref.delete();
                });
            });
    }

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            hideOrderReadyOverlay();
        }
    });

    orderReadyOverlay.addEventListener('click', hideOrderReadyOverlay);

    fetchOrders();
});
