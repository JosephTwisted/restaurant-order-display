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
const googleSigninBtn = document.getElementById('google-signin-btn');
const content = document.getElementById('content');

// Handle Google Sign-In
googleSigninBtn.addEventListener('click', () => {
// Handle Email and Password Login
loginBtn.addEventListener('click', () => {
    const email = emailInput.value;
    const password = passwordInput.value;
    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Signed in
            const user = userCredential.user;
            console.log('User signed in:', user);
            checkUserRole(user);
        })
        .catch((error) => {
            console.error('Error during sign in:', error.message);
        });
});

// Check User Role
function checkUserRole(user) {
    db.collection("users").doc(user.uid).get()
        .then((doc) => {
            if (doc.exists) {
                const userData = doc.data();
                if (userData.role === 'admin') {
                    authContainer.style.display = 'none';
                    content.style.display = 'block';
                    fetchOrders();
                } else {
                    alert("You do not have the necessary permissions to access this application.");
                    auth.signOut();
                }
            } else {
                // New user, add to Firestore with default role 'user'
                db.collection("users").doc(user.uid).set({
                    email: user.email,
                    role: 'user'
                }).then(() => {
                    alert("You do not have the necessary permissions to access this application.");
                    auth.signOut();
                });
            }
        }).catch((error) => {
            console.error('Error checking user role:', error.message);
        });
}

// Auth State Listener
auth.onAuthStateChanged((user) => {
    if (user) {
        checkUserRole(user);
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

});

// Check User Role
function checkUserRole(user) {
    db.collection("users").doc(user.uid).get()
        .then((doc) => {
            if (doc.exists) {
                const userData = doc.data();
                if (userData.role === 'admin') {
                    authContainer.style.display = 'none';
                    content.style.display = 'block';
                    fetchOrders();
                } else {
                    alert("You do not have the necessary permissions to access this application.");
                    auth.signOut();
                }
            } else {
                // New user, add to Firestore with default role 'user'
                db.collection("users").doc(user.uid).set({
                    email: user.email,
                    role: 'user'
                }).then(() => {
                    alert("You do not have the necessary permissions to access this application.");
                    auth.signOut();
                });
            }
        }).catch((error) => {
            console.error('Error checking user role:', error.message);
        });
}

// Auth State Listener
auth.onAuthStateChanged((user) => {
    if (user) {
        checkUserRole(user);
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
