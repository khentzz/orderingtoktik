// ===== PRODUCTS DATA =====
const PRODUCTS = [
  { id: 1, name: 'Cheeseburger', emoji: '🍔', price: 149, desc: 'Juicy beef patty with melted cheese' },
  { id: 2, name: 'Pepperoni Pizza', emoji: '🍕', price: 299, desc: 'Classic pepperoni on crispy crust' },
  { id: 3, name: 'Chicken Wings', emoji: '🍗', price: 199, desc: 'Crispy wings with dipping sauce' },
  { id: 4, name: 'Sushi Roll', emoji: '🍣', price: 249, desc: 'Fresh salmon & avocado roll' },
  { id: 5, name: 'Ramen Bowl', emoji: '🍜', price: 189, desc: 'Rich tonkotsu broth with noodles' },
  { id: 6, name: 'Caesar Salad', emoji: '🥗', price: 129, desc: 'Crisp romaine with caesar dressing' },
  { id: 7, name: 'Tacos', emoji: '🌮', price: 159, desc: 'Three soft tacos with salsa & guac' },
  { id: 8, name: 'Fried Rice', emoji: '🍚', price: 139, desc: 'Wok-fried rice with egg & veggies' },
  { id: 9, name: 'Hot Dog', emoji: '🌭', price: 99,  desc: 'Classic frank with mustard & ketchup' },
  { id: 10, name: 'Ice Cream', emoji: '🍦', price: 89,  desc: 'Creamy soft-serve, 3 flavors' },
];

// ===== STATE =====
let cart = JSON.parse(localStorage.getItem('qb_cart') || '[]');
let currentPage = 'auth';
let pageHistory = [];
let selectedPayment = null;
let trackingInterval = null;
let trackStep = 0;

// ===== PAGE NAVIGATION =====
const PAGE_TITLES = {
  products: 'Menu',
  summary: 'Order Summary',
  address: 'Delivery Address',
  payment: 'Payment',
  tracking: 'Order Tracking',
  history: 'Order History',
};

function showPage(name, addHistory = true) {
  const prev = document.querySelector('.page.active');
  if (prev) {
    prev.classList.remove('active');
    prev.style.display = 'none';
  }

  if (addHistory && currentPage !== name) {
    pageHistory.push(currentPage);
  }
  currentPage = name;

  const next = document.getElementById('page-' + name);
  next.style.display = 'block';
  // force reflow for animation
  next.getBoundingClientRect();
  next.classList.add('active', 'slide-in');
  setTimeout(() => next.classList.remove('slide-in'), 400);

  const nav = document.getElementById('topNav');
  if (name === 'auth') {
    nav.classList.add('hidden');
  } else {
    nav.classList.remove('hidden');
    document.getElementById('pageTitle').textContent = PAGE_TITLES[name] || '';
  }

  // page-specific init
  if (name === 'products') renderProducts(PRODUCTS);
  if (name === 'summary') renderSummary();
  if (name === 'tracking') startTracking();
  if (name === 'history') renderHistory();
  if (name === 'address') prefillAddress();
}

function goBack() {
  if (pageHistory.length > 0) {
    const prev = pageHistory.pop();
    showPage(prev, false);
  }
}

// ===== AUTH =====
function switchTab(tab) {
  document.getElementById('loginForm').classList.toggle('hidden', tab !== 'login');
  document.getElementById('signupForm').classList.toggle('hidden', tab !== 'signup');
  document.getElementById('tabLogin').classList.toggle('active', tab === 'login');
  document.getElementById('tabSignup').classList.toggle('active', tab === 'signup');
}

function doLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const pass  = document.getElementById('loginPass').value;
  const err   = document.getElementById('loginError');
  err.textContent = '';

  if (!email || !pass) { err.textContent = 'Please fill in all fields.'; return; }

  const users = JSON.parse(localStorage.getItem('qb_users') || '[]');
  const user  = users.find(u => u.email === email && u.password === pass);
  if (!user) { err.textContent = 'Invalid email or password.'; return; }

  localStorage.setItem('qb_session', JSON.stringify(user));
  showPage('products');
}

function doSignup() {
  const name  = document.getElementById('signupName').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const pass  = document.getElementById('signupPass').value;
  const err   = document.getElementById('signupError');
  err.textContent = '';

  if (!name || !email || !pass) { err.textContent = 'Please fill in all fields.'; return; }
  if (pass.length < 6) { err.textContent = 'Password must be at least 6 characters.'; return; }

  const users = JSON.parse(localStorage.getItem('qb_users') || '[]');
  if (users.find(u => u.email === email)) { err.textContent = 'Email already registered.'; return; }

  users.push({ name, email, password: pass });
  localStorage.setItem('qb_users', JSON.stringify(users));
  localStorage.setItem('qb_session', JSON.stringify({ name, email }));
  showPage('products');
}

// ===== PRODUCTS =====
function renderProducts(list) {
  const grid = document.getElementById('productGrid');
  grid.innerHTML = list.map(p => {
    const inCart = cart.find(c => c.id === p.id);
    return `
      <div class="product-card">
        <div class="product-img">${p.emoji}</div>
        <div class="product-info">
          <div class="product-name">${p.name}</div>
          <div class="product-desc">${p.desc}</div>
          <div class="product-price">₱${p.price.toFixed(2)}</div>
          <button class="add-btn ${inCart ? 'added' : ''}" id="addbtn-${p.id}" onclick="addToCart(${p.id})">
            ${inCart ? '✓ Added' : '+ Add'}
          </button>
        </div>
      </div>`;
  }).join('');
  updateCartFab();
}

function filterProducts(query) {
  const q = query.toLowerCase();
  const filtered = PRODUCTS.filter(p =>
    p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q)
  );
  renderProducts(filtered);
}

function addToCart(id) {
  const product = PRODUCTS.find(p => p.id === id);
  const existing = cart.find(c => c.id === id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...product, qty: 1 });
  }
  saveCart();
  updateCartFab();

  const btn = document.getElementById('addbtn-' + id);
  if (btn) { btn.textContent = '✓ Added'; btn.classList.add('added'); }
}

function updateCartFab() {
  const total = cart.reduce((s, i) => s + i.qty, 0);
  const fab = document.getElementById('cartFab');
  document.getElementById('cartCount').textContent = total;
  fab.classList.toggle('hidden', total === 0);
}

function saveCart() {
  localStorage.setItem('qb_cart', JSON.stringify(cart));
}

// ===== ORDER SUMMARY =====
function renderSummary() {
  const list = document.getElementById('cartItems');
  if (cart.length === 0) {
    list.innerHTML = '<p style="color:var(--muted);text-align:center;padding:40px 0">Your cart is empty</p>';
    document.getElementById('subtotal').textContent = '₱0.00';
    document.getElementById('totalPrice').textContent = '₱50.00';
    return;
  }

  list.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div class="cart-item-emoji">${item.emoji}</div>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">₱${(item.price * item.qty).toFixed(2)}</div>
      </div>
      <div class="qty-controls">
        <button class="qty-btn" onclick="changeQty(${item.id}, -1)">−</button>
        <span class="qty-num">${item.qty}</span>
        <button class="qty-btn" onclick="changeQty(${item.id}, 1)">+</button>
      </div>
      <button class="remove-btn" onclick="removeItem(${item.id})">🗑</button>
    </div>`).join('');

  const sub = cart.reduce((s, i) => s + i.price * i.qty, 0);
  document.getElementById('subtotal').textContent = '₱' + sub.toFixed(2);
  document.getElementById('totalPrice').textContent = '₱' + (sub + 50).toFixed(2);
}

function changeQty(id, delta) {
  const item = cart.find(c => c.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) removeItem(id);
  else { saveCart(); renderSummary(); updateCartFab(); }
}

function removeItem(id) {
  cart = cart.filter(c => c.id !== id);
  saveCart();
  renderSummary();
  updateCartFab();
  // refresh add buttons if on products
  if (currentPage === 'products') renderProducts(PRODUCTS);
}

// ===== ADDRESS =====
function prefillAddress() {
  const saved = JSON.parse(localStorage.getItem('qb_address') || '{}');
  if (saved.name)   document.getElementById('addrName').value   = saved.name;
  if (saved.phone)  document.getElementById('addrPhone').value  = saved.phone;
  if (saved.street) document.getElementById('addrStreet').value = saved.street;
  if (saved.city)   document.getElementById('addrCity').value   = saved.city;
  if (saved.postal) document.getElementById('addrPostal').value = saved.postal;
}

function saveAddress() {
  const name   = document.getElementById('addrName').value.trim();
  const phone  = document.getElementById('addrPhone').value.trim();
  const street = document.getElementById('addrStreet').value.trim();
  const city   = document.getElementById('addrCity').value.trim();
  const postal = document.getElementById('addrPostal').value.trim();
  const err    = document.getElementById('addrError');
  err.textContent = '';

  if (!name || !phone || !street || !city || !postal) {
    err.textContent = 'Please fill in all address fields.'; return;
  }

  localStorage.setItem('qb_address', JSON.stringify({ name, phone, street, city, postal }));
  showPage('payment');
}

// ===== PAYMENT =====
function selectPayment(type) {
  selectedPayment = type;
  document.querySelectorAll('.payment-card').forEach(c => c.classList.remove('selected'));
  document.getElementById('pay-' + type).classList.add('selected');
  document.getElementById('cardFields').classList.toggle('hidden', type !== 'card');
  document.getElementById('payError').textContent = '';
}

function formatCard(input) {
  let v = input.value.replace(/\D/g, '').substring(0, 16);
  input.value = v.replace(/(.{4})/g, '$1 ').trim();
}

function placeOrder() {
  const err = document.getElementById('payError');
  err.textContent = '';

  if (!selectedPayment) { err.textContent = 'Please select a payment method.'; return; }

  if (selectedPayment === 'card') {
    const num = document.getElementById('cardNum').value.replace(/\s/g, '');
    const exp = document.getElementById('cardExp').value;
    const cvv = document.getElementById('cardCvv').value;
    if (num.length < 16 || !exp || cvv.length < 3) {
      err.textContent = 'Please enter valid card details.'; return;
    }
  }

  // Save order to history
  const sub = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const order = {
    id: Date.now(),
    date: new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }),
    items: cart.map(i => ({ name: i.name, qty: i.qty, price: i.price })),
    total: sub + 50,
    status: 'Delivered',
    payment: selectedPayment,
  };

  const history = JSON.parse(localStorage.getItem('qb_orders') || '[]');
  history.unshift(order);
  localStorage.setItem('qb_orders', JSON.stringify(history));

  showPage('tracking');
}

// ===== TRACKING =====
function startTracking() {
  if (trackingInterval) clearInterval(trackingInterval);
  trackStep = 0;
  updateTrackUI();

  // Populate recap
  const sub = cart.reduce((s, i) => s + i.price * i.qty, 0);
  document.getElementById('trackTotal').textContent = '₱' + (sub + 50).toFixed(2);
  document.getElementById('trackItems').innerHTML = cart.map(i =>
    `<div class="recap-item"><span>${i.emoji} ${i.name} x${i.qty}</span><span>₱${(i.price * i.qty).toFixed(2)}</span></div>`
  ).join('');

  trackingInterval = setInterval(() => {
    if (trackStep < 3) {
      trackStep++;
      updateTrackUI();
    } else {
      clearInterval(trackingInterval);
      // Clear cart after delivery
      cart = [];
      saveCart();
    }
  }, 3500);
}

function updateTrackUI() {
  const labels = ['step0','step1','step2','step3'];
  const lines  = ['line0','line1','line2'];
  const etas   = ['~30 mins','~20 mins','~10 mins','Delivered!'];

  labels.forEach((id, i) => {
    const dot = document.querySelector('#' + id + ' .step-dot');
    const step = document.getElementById(id);
    dot.classList.remove('active', 'done');
    step.classList.remove('done');
    if (i < trackStep)  { dot.classList.add('done'); step.classList.add('done'); }
    if (i === trackStep) dot.classList.add('active');
  });

  lines.forEach((id, i) => {
    document.getElementById(id).classList.toggle('done', i < trackStep);
  });

  document.getElementById('trackEta').textContent = 'Estimated delivery: ' + etas[trackStep];
}

// ===== ORDER HISTORY =====
function renderHistory() {
  const orders = JSON.parse(localStorage.getItem('qb_orders') || '[]');
  const list = document.getElementById('historyList');

  if (orders.length === 0) {
    list.innerHTML = '<p style="color:var(--muted);text-align:center;padding:60px 0">No orders yet</p>';
    return;
  }

  list.innerHTML = orders.map(o => `
    <div class="history-card">
      <div class="history-header">
        <span class="history-date">${o.date}</span>
        <span class="status-badge badge-delivered">${o.status}</span>
      </div>
      <div class="history-items">${o.items.map(i => `${i.name} x${i.qty}`).join(', ')}</div>
      <div class="history-total">Total: ₱${o.total.toFixed(2)}</div>
    </div>`).join('');
}

// ===== INIT =====
(function init() {
  const session = localStorage.getItem('qb_session');
  if (session) {
    showPage('products', false);
  } else {
    showPage('auth', false);
  }
})();
