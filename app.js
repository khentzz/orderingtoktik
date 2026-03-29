// ===== DATA =====
const PRODUCTS = [
  { id:1,  name:'Wireless Earbuds',    emoji:'\uD83C\uDFA7', price:899,  desc:'True wireless, 24hr battery life',   cat:'Electronics', hot:true  },
  { id:2,  name:'Smart Watch',         emoji:'\u231A',        price:1499, desc:'Heart rate, GPS, sleep tracking',    cat:'Electronics', hot:true  },
  { id:3,  name:'Running Sneakers',    emoji:'\uD83D\uDC5F', price:1299, desc:'Lightweight, breathable mesh upper', cat:'Footwear',    hot:true  },
  { id:4,  name:'Graphic Tee',         emoji:'\uD83D\uDC55', price:349,  desc:'100% cotton, unisex streetwear fit', cat:'Clothing',    hot:false },
  { id:5,  name:'Denim Jacket',        emoji:'\uD83E\uDDE5', price:999,  desc:'Classic slim-fit, washed denim',     cat:'Clothing',    hot:false },
  { id:6,  name:'Leather Wallet',      emoji:'\uD83D\uDC5C', price:499,  desc:'Slim RFID-blocking genuine leather', cat:'Accessories', hot:false },
  { id:7,  name:'Sunglasses',          emoji:'\uD83D\uDD76', price:599,  desc:'UV400 polarized, metal frame',       cat:'Accessories', hot:false },
  { id:8,  name:'Portable Charger',    emoji:'\uD83D\uDD0B', price:749,  desc:'20,000mAh, fast charge, dual USB-C', cat:'Electronics', hot:false },
  { id:9,  name:'Yoga Mat',            emoji:'\uD83E\uDDD8', price:449,  desc:'Non-slip, 6mm thick, carry strap',   cat:'Sports',      hot:false },
  { id:10, name:'Baseball Cap',        emoji:'\uD83E\uDDE2', price:299,  desc:'Adjustable strap, embroidered logo', cat:'Accessories', hot:false },
  { id:11, name:'Mechanical Keyboard', emoji:'\uD83D\uDCBB', price:1899, desc:'RGB backlit, tactile switches',      cat:'Electronics', hot:true  },
  { id:12, name:'Slip-on Sandals',     emoji:'\uD83D\uDC61', price:399,  desc:'Memory foam insole, water-resistant',cat:'Footwear',    hot:false },
];
const CATS = ['All','Electronics','Clothing','Footwear','Accessories','Sports'];

// ===== STATE =====
let cart     = JSON.parse(localStorage.getItem('sb_cart')    || '[]');
let curPage  = 'auth';
let history  = [];
let selPay   = null;
let trackInt = null;
let tStep    = 0;
let activeCat= 'All';

// pages that show bottom nav
const NAV_PAGES = ['home','cart','orders','profile'];
const TITLES = { home:'SnapBite', cart:'Your Cart', address:'Delivery', payment:'Payment', tracking:'Tracking', orders:'My Orders', profile:'Profile' };

// ===== NAVIGATION =====
function navTo(name) { showPage(name, true, false); }
function goBack()    { if(history.length) showPage(history.pop(), false, true); }

function showPage(name, push=true, back=false) {
  const prev = document.querySelector('.page.active');
  if(prev){ prev.classList.remove('active'); prev.style.display='none'; }

  if(push && curPage !== name) history.push(curPage);
  curPage = name;

  const next = document.getElementById('page-'+name);
  next.style.display = 'block';
  next.getBoundingClientRect();
  next.classList.add('active', back ? 'slide-back' : 'slide-in');
  setTimeout(()=>next.classList.remove('slide-in','slide-back'), 300);

  // top bar
  const tb = document.getElementById('topBar');
  const bn = document.getElementById('bottomNav');
  if(name === 'auth'){
    tb.classList.add('hidden');
    bn.classList.add('hidden');
  } else {
    tb.classList.remove('hidden');
    document.getElementById('topBarTitle').textContent = TITLES[name]||'';
    // hide right icon on pages where it doesn't make sense
    const tr = document.getElementById('topBarRight');
    tr.style.visibility = (name==='orders'||name==='profile') ? 'hidden' : 'visible';
    // bottom nav
    if(NAV_PAGES.includes(name)){
      bn.classList.remove('hidden');
      document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
      const nb = document.getElementById('nav-'+name);
      if(nb) nb.classList.add('active');
    } else {
      bn.classList.add('hidden');
    }
  }

  // page init hooks
  if(name==='home')     initHome();
  if(name==='cart')     renderCart();
  if(name==='address')  prefillAddr();
  if(name==='payment')  initPayment();
  if(name==='tracking') startTracking();
  if(name==='orders')   renderOrders();
  if(name==='profile')  renderProfile();
}

// ===== AUTH =====
function switchTab(t){
  document.getElementById('loginForm').classList.toggle('hidden', t!=='login');
  document.getElementById('signupForm').classList.toggle('hidden', t!=='signup');
  document.getElementById('tabLogin').classList.toggle('active', t==='login');
  document.getElementById('tabSignup').classList.toggle('active', t==='signup');
}

function doLogin(){
  const email = document.getElementById('loginEmail').value.trim();
  const pass  = document.getElementById('loginPass').value;
  const err   = document.getElementById('loginErr');
  err.textContent = '';
  if(!email||!pass){ err.textContent='Fill in all fields.'; return; }
  const users = JSON.parse(localStorage.getItem('sb_users')||'[]');
  const user  = users.find(u=>u.email===email && u.password===pass);
  if(!user){ err.textContent='Wrong email or password.'; return; }
  localStorage.setItem('sb_session', JSON.stringify(user));
  showPage('home', false);
}

function doSignup(){
  const name  = document.getElementById('signupName').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const pass  = document.getElementById('signupPass').value;
  const err   = document.getElementById('signupErr');
  err.textContent = '';
  if(!name||!email||!pass){ err.textContent='Fill in all fields.'; return; }
  if(pass.length<6){ err.textContent='Password needs 6+ characters.'; return; }
  const users = JSON.parse(localStorage.getItem('sb_users')||'[]');
  if(users.find(u=>u.email===email)){ err.textContent='Email already in use.'; return; }
  users.push({name,email,password:pass});
  localStorage.setItem('sb_users', JSON.stringify(users));
  localStorage.setItem('sb_session', JSON.stringify({name,email}));
  showPage('home', false);
}

function doLogout(){
  localStorage.removeItem('sb_session');
  cart=[]; saveCart();
  history=[];
  showPage('auth', false);
}

// ===== SOCIAL LOGIN =====
function socialLogin(provider){
  // Simulate OAuth — in production wire up real SDK here
  const profiles = {
    facebook: { name:'Facebook User', email:'fb.user@snapbite.app' },
    email:    null, // falls through to show the email form
  };
  if(provider === 'email'){
    // just scroll focus to the email field
    switchTab('login');
    setTimeout(()=>document.getElementById('loginEmail').focus(), 50);
    return;
  }
  const p = profiles[provider];
  // auto-register/login the social user
  const users = JSON.parse(localStorage.getItem('sb_users')||'[]');
  if(!users.find(u=>u.email===p.email)){
    users.push({ name:p.name, email:p.email, password:'__social__', provider });
    localStorage.setItem('sb_users', JSON.stringify(users));
  }
  localStorage.setItem('sb_session', JSON.stringify({ name:p.name, email:p.email, provider }));
  showPage('home', false);
}

// ===== HOME =====
let feedList = [...PRODUCTS];

function initHome(){
  const s = JSON.parse(localStorage.getItem('sb_session')||'{}');
  document.getElementById('heroGreet').textContent =
    s.name ? 'Hey, '+s.name.split(' ')[0]+' 👋' : 'Hey there 👋';
  renderFeedCats();
  renderFeatured();
  renderGrid(feedList);
  updateFab();
}

function renderFeedCats(){
  document.getElementById('feedCats').innerHTML = CATS.map(c=>
    '<div class="feed-cat'+(c===activeCat?' on':'')+'" onclick="setFeedCat(\''+c+'\')">'+c+'</div>'
  ).join('');
}

function setFeedCat(c){
  activeCat = c;
  feedList = c==='All' ? [...PRODUCTS] : PRODUCTS.filter(p=>p.cat===c);
  renderFeedCats();
  renderGrid(feedList);
  document.getElementById('allHd').textContent = c==='All' ? 'All Items' : c;
}

function toggleFeedSearch(){
  const bar = document.getElementById('feedSearchBar');
  bar.classList.toggle('hidden');
  if(!bar.classList.contains('hidden'))
    document.getElementById('feedSearchInp').focus();
}

function homeSearch(q){
  const lq = q.toLowerCase();
  const base = activeCat==='All' ? PRODUCTS : PRODUCTS.filter(p=>p.cat===activeCat);
  renderGrid(base.filter(p=>p.name.toLowerCase().includes(lq)||p.desc.toLowerCase().includes(lq)));
}

function renderFeatured(){
  const hot = PRODUCTS.filter(p=>p.hot);
  document.getElementById('featuredRow').innerHTML = hot.map(p=>
    '<div class="feat-card" onclick="addToCart('+p.id+',true)">' +
      '<div class="feat-hot-badge">🔥 Hot</div>' +
      '<div class="feat-img">'+p.emoji+'</div>' +
      '<div class="feat-info">' +
        '<div class="feat-name">'+p.name+'</div>' +
        '<div class="feat-price">₱'+p.price+'</div>' +
      '</div>' +
    '</div>'
  ).join('');
}

function renderGrid(list){
  const g = document.getElementById('homeGrid');
  if(!list.length){
    g.innerHTML='<div class="empty" style="grid-column:1/-1"><div class="empty-ico">🔍</div><p>Nothing found</p></div>';
    return;
  }
  g.innerHTML = list.map(p=>{
    const inCart = cart.find(c=>c.id===p.id);
    return '<div class="p-card">' +
      '<div class="p-img">' +
        (p.hot?'<div class="p-badge">🔥 Hot</div>':'') +
        p.emoji +
      '</div>' +
      '<div class="p-info">' +
        '<div class="p-name">'+p.name+'</div>' +
        '<div class="p-desc">'+p.desc+'</div>' +
        '<div class="p-foot">' +
          '<div class="p-price">₱'+p.price+'</div>' +
          '<button class="add-btn'+(inCart?' on':'')+'" id="ab-'+p.id+'" onclick="addToCart('+p.id+')">' +
            (inCart?'✓':'+') +
          '</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  }).join('');
}

function addToCart(id, fromFeatured=false){
  const p = PRODUCTS.find(p=>p.id===id);
  const ex = cart.find(c=>c.id===id);
  if(ex) ex.qty++;
  else cart.push(Object.assign({},p,{qty:1}));
  saveCart(); updateFab();
  const btn = document.getElementById('ab-'+id);
  if(btn){ btn.textContent='✓'; btn.classList.add('on'); }
  if(fromFeatured) renderGrid(feedList);
}

function saveCart(){ localStorage.setItem('sb_cart', JSON.stringify(cart)); }

function updateFab(){
  const total = cart.reduce((s,i)=>s+i.qty,0);
  const fab = document.getElementById('cartFab');
  document.getElementById('cartCount').textContent = total;
  if(fab) fab.classList.toggle('hidden', total===0);
  // nav badge
  const nb = document.getElementById('navCartBadge');
  if(nb){ nb.textContent=total; nb.classList.toggle('hidden',total===0); }
}

// ===== CART =====
function renderCart(){
  const body  = document.getElementById('cartBody');
  const panel = document.getElementById('cartPricePanel');
  if(!cart.length){
    body.innerHTML='<div class="empty"><div class="empty-ico">\uD83D\uDED2</div><p>Your cart is empty</p></div>';
    panel.classList.add('hidden'); return;
  }
  panel.classList.remove('hidden');
  body.innerHTML = cart.map(item=>
    '<div class="cart-item">' +
      '<div class="ci-emoji">'+item.emoji+'</div>' +
      '<div class="ci-info">' +
        '<div class="ci-name">'+item.name+'</div>' +
        '<div class="ci-price">\u20B1'+(item.price*item.qty).toFixed(2)+'</div>' +
      '</div>' +
      '<div class="qty-row">' +
        '<button class="qty-btn" onclick="chgQty('+item.id+',-1)">\u2212</button>' +
        '<span class="qty-num">'+item.qty+'</span>' +
        '<button class="qty-btn" onclick="chgQty('+item.id+',1)">+</button>' +
      '</div>' +
      '<button class="rm-btn" onclick="rmItem('+item.id+')">\u2715</button>' +
    '</div>'
  ).join('');
  const sub = cart.reduce((s,i)=>s+i.price*i.qty,0);
  document.getElementById('cartSubtotal').textContent = '\u20B1'+sub.toFixed(2);
  document.getElementById('cartTotal').textContent    = '\u20B1'+(sub+50).toFixed(2);
}

function chgQty(id,d){
  const item = cart.find(c=>c.id===id);
  if(!item) return;
  item.qty+=d;
  if(item.qty<=0) rmItem(id);
  else { saveCart(); renderCart(); updateFab(); }
}

function rmItem(id){
  cart = cart.filter(c=>c.id!==id);
  saveCart(); renderCart(); updateFab();
  if(curPage==='home') renderGrid(PRODUCTS);
}

// ===== ADDRESS =====
function prefillAddr(){
  const s = JSON.parse(localStorage.getItem('sb_addr')||'{}');
  ['Name','Phone','Street','City','Postal','Note'].forEach(k=>{
    const el = document.getElementById('addr'+k);
    if(el && s[k.toLowerCase()]) el.value = s[k.toLowerCase()];
  });
}

function saveAddress(){
  const name   = document.getElementById('addrName').value.trim();
  const phone  = document.getElementById('addrPhone').value.trim();
  const street = document.getElementById('addrStreet').value.trim();
  const city   = document.getElementById('addrCity').value.trim();
  const postal = document.getElementById('addrPostal').value.trim();
  const note   = document.getElementById('addrNote').value.trim();
  const err    = document.getElementById('addrErr');
  err.textContent='';
  if(!name||!phone||!street||!city||!postal){ err.textContent='Please fill in all required fields.'; return; }
  localStorage.setItem('sb_addr', JSON.stringify({name,phone,street,city,postal,note}));
  navTo('payment');
}

// ===== PAYMENT =====
function initPayment(){
  const sub = cart.reduce((s,i)=>s+i.price*i.qty,0);
  document.getElementById('payTotal').textContent = '\u20B1'+(sub+50).toFixed(2);
  document.getElementById('paySumItems').innerHTML = cart.map(i=>
    '<div class="recap-item"><span>'+i.emoji+' '+i.name+' \xD7'+i.qty+'</span><span>\u20B1'+(i.price*i.qty).toFixed(2)+'</span></div>'
  ).join('');
}

function selectPay(t){
  selPay = t;
  document.querySelectorAll('.pay-card').forEach(c=>c.classList.remove('sel'));
  document.getElementById('pay-'+t).classList.add('sel');
  document.getElementById('cardFields').classList.toggle('hidden', t!=='card');
  document.getElementById('payErr').textContent='';
}

function fmtCard(inp){
  let v = inp.value.replace(/\D/g,'').substring(0,16);
  inp.value = v.replace(/(.{4})/g,'$1 ').trim();
}

function placeOrder(){
  const err = document.getElementById('payErr');
  err.textContent='';
  if(!selPay){ err.textContent='Select a payment method.'; return; }
  if(selPay==='card'){
    const num = document.getElementById('cardNum').value.replace(/\s/g,'');
    const exp = document.getElementById('cardExp').value;
    const cvv = document.getElementById('cardCvv').value;
    if(num.length<16||!exp||cvv.length<3){ err.textContent='Enter valid card details.'; return; }
  }
  const sub = cart.reduce((s,i)=>s+i.price*i.qty,0);
  const addr = JSON.parse(localStorage.getItem('sb_addr')||'{}');
  const order = {
    id: Date.now(),
    date: new Date().toLocaleDateString('en-PH',{year:'numeric',month:'short',day:'numeric'}),
    items: cart.map(i=>({name:i.name,emoji:i.emoji,qty:i.qty,price:i.price})),
    total: sub+50, status:'Delivered', payment:selPay,
    addr: addr.street ? addr.street+', '+addr.city : '—',
  };
  const orders = JSON.parse(localStorage.getItem('sb_orders')||'[]');
  orders.unshift(order);
  localStorage.setItem('sb_orders', JSON.stringify(orders));
  navTo('tracking');
}

// ===== TRACKING =====
function startTracking(){
  if(trackInt) clearInterval(trackInt);
  tStep=0; updateTrack();

  const orders = JSON.parse(localStorage.getItem('sb_orders')||'[]');
  const last   = orders[0]||{};
  const addr   = JSON.parse(localStorage.getItem('sb_addr')||'{}');
  const payMap = {card:'Credit Card',gcash:'GCash / E-Wallet',cod:'Cash on Delivery'};

  document.getElementById('tiOrderId').textContent = '#'+String(last.id||0).slice(-6);
  document.getElementById('tiAddr').textContent    = addr.street ? addr.street+', '+addr.city : '—';
  document.getElementById('tiPay').textContent     = payMap[last.payment]||'—';
  document.getElementById('trackTotal').textContent= '\u20B1'+(last.total||0).toFixed(2);
  document.getElementById('trackItems').innerHTML  = (last.items||[]).map(i=>
    '<div class="recap-item"><span>'+i.emoji+' '+i.name+' \xD7'+i.qty+'</span><span>\u20B1'+(i.price*i.qty).toFixed(2)+'</span></div>'
  ).join('');

  trackInt = setInterval(()=>{
    if(tStep<3){ tStep++; updateTrack(); }
    else{ clearInterval(trackInt); cart=[]; saveCart(); updateFab(); }
  }, 3500);
}

function updateTrack(){
  const etas=['~30 mins','~20 mins','~10 mins','\uD83C\uDF89 Delivered!'];
  ['ts0','ts1','ts2','ts3'].forEach((id,i)=>{
    const item = document.getElementById(id);
    const dot  = item.querySelector('.ts-dot');
    dot.classList.remove('active','done');
    item.classList.remove('done');
    if(i<tStep)  { dot.classList.add('done'); item.classList.add('done'); }
    if(i===tStep)  dot.classList.add('active');
  });
  ['tl0','tl1','tl2'].forEach((id,i)=>{
    document.getElementById(id).classList.toggle('done', i<tStep);
  });
  document.getElementById('trackEta').textContent = etas[tStep];
}

// ===== ORDERS =====
function renderOrders(){
  const orders = JSON.parse(localStorage.getItem('sb_orders')||'[]');
  const el = document.getElementById('ordersList');
  if(!orders.length){
    el.innerHTML='<div class="empty"><div class="empty-ico">\uD83D\uDCCB</div><p>No orders yet</p></div>';
    return;
  }
  el.innerHTML = orders.map((o,idx)=>
    '<div class="order-card">' +
      '<div class="oc-top">' +
        '<div>' +
          '<div class="oc-id">Order #'+String(orders.length-idx).padStart(3,'0')+'</div>' +
          '<div class="oc-date">'+o.date+'</div>' +
        '</div>' +
        '<span class="badge b-done">'+o.status+'</span>' +
      '</div>' +
      '<div class="oc-items">'+o.items.map(i=>i.emoji+' '+i.name+' \xD7'+i.qty).join(' \xB7 ')+'</div>' +
      '<div class="oc-total">\u20B1'+o.total.toFixed(2)+'</div>' +
    '</div>'
  ).join('');
}

// ===== PROFILE =====
function renderProfile(){
  const s = JSON.parse(localStorage.getItem('sb_session')||'{}');
  document.getElementById('profileName').textContent  = s.name  || 'Guest';
  document.getElementById('profileEmail').textContent = s.email || '—';
  // avatar initial
  const av = document.getElementById('profileAvatar');
  av.textContent = s.name ? s.name.charAt(0).toUpperCase() : '\uD83D\uDC64';
  av.style.cssText = 'font-size:36px;font-weight:900;width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,var(--pink),var(--cyan));display:flex;align-items:center;justify-content:center;margin:0 auto 10px;color:#000;';
}

// ===== INIT =====
(function(){
  updateFab();
  showPage(localStorage.getItem('sb_session') ? 'home' : 'auth', false);
})();
