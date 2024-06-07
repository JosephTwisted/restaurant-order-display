// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCimFXgJYIXZgKIV4kzWQihtspXTa7sF-Q",
    authDomain: "hickoryonlineorder.firebaseapp.com",
    databaseURL: "https://hickoryonlineorder-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "hickoryonlineorder",
    storageBucket: "hickoryonlineorder.appspot.com",
    messagingSenderId: "505589625096",
    appId: "1:505589625096:web:559505647e204c157a7cbd",
    measurementId: "G-S07LBX209D"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// Authentication Elements
const authContainer = document.getElementById('auth-container');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const content = document.getElementById('content');

// Login Elements
const loginEmail = document.getElementById('login-email');
const loginPassword = document.getElementById('login-password');
const loginBtn = document.getElementById('login-btn');
const showSignupBtn = document.getElementById('show-signup-btn');

// Signup Elements
const signupEmail = document.getElementById('signup-email');
const signupPassword = document.getElementById('signup-password');
const signupBtn = document.getElementById('signup-btn');
const showLoginBtn = document.getElementById('show-login-btn');

// Switch to Signup Form
showSignupBtn.addEventListener('click', () => {
    loginForm.style.display = 'none';
    signupForm.style.display = 'block';
});

// Switch to Login Form
showLoginBtn.addEventListener('click', () => {
    signupForm.style.display = 'none';
    loginForm.style.display = 'block';
});

// Handle Signup
signupBtn.addEventListener('click', () => {
    const email = signupEmail.value;
    const password = signupPassword.value;
    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            console.log('User signed up:', userCredential.user);
        })
        .catch((error) => {
            console.error('Error signing up:', error.message);
        });
});

// Handle Login
loginBtn.addEventListener('click', () => {
    const email = loginEmail.value;
    const password = loginPassword.value;
    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            console.log('User logged in:', userCredential.user);
        })
        .catch((error) => {
            console.error('Error logging in:', error.message);
        });
});

// Auth State Listener
auth.onAuthStateChanged((user) => {
    if (user) {
        authContainer.style.display = 'none';
        content.style.display = 'block';
        fetchOrders();
    } else {
        authContainer.style.display = 'block';
        content.style.display = 'none';
    }
});

// Define hideOrderReadyOverlay globally
window.hideOrderReadyOverlay = function() {
    const orderReadyOverlay = document.getElementById('order-ready-overlay');
    const videoContainer = document.getElementById('video-container');
    orderReadyOverlay.style.display = 'none';
    videoContainer.classList.remove('blur');
};

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

    async function addOrder(timeLeft) {
        try {
            const orderNumber = Date.now();
            await db.collection("orders").add({
                number: orderNumber,
                timeLeft: timeLeft,
                status: 'Being Prepared'
            });
        } catch (e) {
            console.error("Error adding document: ", e);
        }
    }

    addOrderBtn.addEventListener('click', async () => {
        const ordersInProgress = [];
        const querySnapshot = await db.collection("orders").where("status", "==", "Being Prepared").get();
        querySnapshot.forEach((doc) => {
            ordersInProgress.push(doc.data());
        });

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

    async function completeOrder(orderNumber) {
        const querySnapshot = await db.collection("orders").where("number", "==", orderNumber).get();
        querySnapshot.forEach((document) => {
            db.collection("orders").doc(document.id).update({ status: 'Ready for Pickup' });
            showOrderReady(orderNumber);
        });
    }

    function showOrderReady(orderNumber) {
        const audio = new Audio('order-ready.mp3');
        audio.play();
        videoContainer.classList.add('blur');
        orderReadyContent.textContent = `Order #${String(orderNumber).padStart(3, '0')} is Ready!`;
        orderReadyOverlay.style.display = 'flex';
    }

    async function removeOrder(orderNumber) {
        const querySnapshot = await db.collection("orders").where("number", "==", orderNumber).get();
        querySnapshot.forEach((document) => {
            db.collection("orders").doc(document.id).delete();
        });
    }

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            hideOrderReadyOverlay();
        }
    });

    // Add touch and click event listeners to the overlay
    orderReadyOverlay.addEventListener('click', hideOrderReadyOverlay);
    orderReadyOverlay.addEventListener('touchend', hideOrderReadyOverlay);

    // Ensure overlay is hidden initially
    hideOrderReadyOverlay();

    fetchOrders();
});
