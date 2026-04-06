import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, doc, onSnapshot, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// --- FIREBASE CONFIGURATION ---
const firebaseConfig = {
    apiKey: "AIzaSyC4Q_jVLFJ8v9YyPLpFHOV1fNpayzQMc88",
    authDomain: "wishlist1627.firebaseapp.com",
    projectId: "wishlist1627",
    storageBucket: "wishlist1627.firebasestorage.app",
    messagingSenderId: "817139671833",
    appId: "1:817139671833:web:df7973679365444f679b88",
    measurementId: "G-8F4SYXR5PE"
  };

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const FIRST_DATE = "2022-05-17";

let state = {
    currentMonthId: "", 
    months: {}, 
    wishlist: [],
    wishlistBought: []
};

let docRef; // Pointer to our specific database document

// --- AUTH & SYNC LOGIC ---
window.loginWithKey = function() {
    const key = document.getElementById('couple-id-input').value.trim();
    if (key === "17052022") {
        localStorage.setItem('couple_sync_key', key);
        startSync(key);
    } else {
        alert("Sadly, you forget the special date! 💔");
    }
};

const savedKey = localStorage.getItem('couple_sync_key');
if (savedKey === "17052022" || savedKey === "test") {
    startSync(savedKey);
} else {
    setTimeout(() => {
        const answer = prompt("The day you becoming mine");
        if (answer === "17052022") {
            localStorage.setItem('couple_sync_key', "17052022");
            startSync("17052022");
        } else {
            alert("Sadly, you forget the special date! 💔");
        }
    }, 500);
}

function startSync(key) {
    document.getElementById('login-overlay').classList.add('hidden');
    document.getElementById('app-content').classList.replace('opacity-0', 'opacity-100');
    
    // Connect to the specific "room" for this couple key
    docRef = doc(db, "relationships", key);
    
    // Listen for real-time changes
    onSnapshot(docRef, (snap) => {
        if (snap.exists()) {
            state = snap.data();
            updateUI();
        } else {
            // If the key is brand new, create the first data entry
            saveData();
        }
    });
}

async function saveData() {
    if (docRef) {
        try {
            await setDoc(docRef, state);
        } catch (error) {
            console.error("Error saving data:", error);
            alert("⚠️ Failed to sync changes. Please check your connection.");
        }
    }
}

// --- APP LOGIC (Identical to your original) ---
function getMonthId() {
    const d = new Date();
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
}

function checkMonthlyReset() {
    const mid = getMonthId();
    // Only update ID, don't auto-create new month (manual setup via button)
    state.currentMonthId = mid;
}

window.finishSetup = function() {
    const b = parseInt(document.getElementById('setup-budget').value);
    if (b > 0) {
        state.months[getMonthId()].budget = b;
        state.months[getMonthId()].initial = b;
        document.getElementById('setup-overlay').classList.add('hidden');
        saveData();
    }
}

window.editBudget = function() {
    const mid = getMonthId();
    const cur = state.months[mid];
    if (!cur) return;

    const newInitialStr = prompt("Update TOTAL budget for this month:", cur.initial);
    if (newInitialStr === null) return;
    
    const newInitial = parseInt(newInitialStr);
    if (isNaN(newInitial)) return;

    const diff = newInitial - cur.initial;
    cur.initial = newInitial;
    cur.budget += diff;
    
    saveData();
}

function updateUI() {
    checkMonthlyReset();
    const cur = state.months[getMonthId()];
    if (!cur) return;

    const displayBudget = document.getElementById('display-budget');
    displayBudget.innerText = `${cur.budget.toLocaleString()}k`;
    
    // Budget warning - if less than 20% remaining
    const budgetPercent = cur.initial > 0 ? (cur.budget / cur.initial) * 100 : 0;
    if (budgetPercent < 20 && budgetPercent > 0) {
        displayBudget.parentElement.parentElement.classList.add('budget-warning');
    } else {
        displayBudget.parentElement.parentElement.classList.remove('budget-warning');
    }
    
    document.getElementById('total-spent').innerText = `${(cur.initial - cur.budget).toLocaleString()}k`;
    
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    document.getElementById('days-left-count').innerText = `${lastDay - now.getDate()} days`;

    const diff = Math.floor((now - new Date(FIRST_DATE)) / (1000 * 60 * 60 * 24));
    document.getElementById('days-count-top').innerText = `Day ${diff} of loving you`;
    document.getElementById('days-together-footer').innerText = `${diff} Days Together`;

    const fill = cur.initial > 0 ? (cur.budget / cur.initial) * 100 : 0;
    document.getElementById('health-bar-fill').style.width = `${Math.max(0, fill)}%`;

    renderWishlist();
    renderHistory();
    initChart();
    displayCoupleId();
}

window.addWish = async function() {
    const itemInput = document.getElementById('wish-item');
    const priceInput = document.getElementById('wish-price-input');
    const price = parseInt(priceInput.value) || 0;
    const link = document.getElementById('wish-link').value;
    const notes = document.getElementById('wish-notes').value;
    const btn = document.getElementById('add-wish-btn');

    if (price <= 0) {
        alert("Please enter a valid price 💰");
        return;
    }

    btn.innerText = "💖 Making a Wish..."; btn.disabled = true;
    let img = "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=400"; // Fallback image
    let name = itemInput.value;

    if (link) {
        try {
            const res = await fetch(`https://api.microlink.io?url=${encodeURIComponent(link)}`, {
                headers: { 'Accept': 'application/json' }
            });
            const data = await res.json();
            if (data.status === 'success' && data.data) {
                // Try to get the best image available
                img = data.data.image?.url || data.data.logo?.url || data.data.thumbnail?.url || img;
                // Auto-fill name if not provided
                if (!name || name.trim() === '') {
                    name = data.data.title || data.data.description || "Surprise Gift";
                }
                console.log("✅ Preview fetched:", {name, img});
            }
        } catch (e) { 
            console.warn("⚠️ Link preview API failed (will use placeholder):", e.message); 
        }
    }

    state.wishlist.push({
        id: Date.now(),
        item: name || "Surprise Gift",
        price,
        priority: parseInt(document.getElementById('wish-priority').value),
        owner: document.getElementById('wish-owner').value,
        link, img, notes
    });
    
    state.wishlist.sort((a, b) => a.priority - b.priority);
    itemInput.value = ''; priceInput.value = ''; document.getElementById('wish-link').value = ''; document.getElementById('wish-notes').value = '';
    btn.innerText = "Add to List"; btn.disabled = false;
    saveData();
    showToast("✨ Wish added successfully!");
}

window.purchaseWish = function(id) {
    const idx = state.wishlist.findIndex(w => w.id === id);
    if (idx === -1) {
        alert("Item no longer exists!");
        return;
    }
    const item = state.wishlist[idx];
    if (confirm(`💖 Buying "${item.item}" for my love? \nThis will use ${item.price}k from our budget.`)) {
        const cur = state.months[getMonthId()];
        cur.budget -= item.price;
        cur.spending.Shopping = (cur.spending.Shopping || 0) + item.price;
        cur.logs.unshift({ cat: 'Shopping', amt: item.price, detail: `Gift: ${item.item}`, time: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) });
        
        state.wishlistBought.unshift({...item, boughtDate: new Date().toLocaleDateString()});
        state.wishlist.splice(idx, 1);
        saveData();
        showToast(`🎁 You bought "${item.item}" for your love!`);
    }
}

window.deleteWish = function(id) {
    if (confirm("💔 Do you really want to let this wish go?")) {
        state.wishlist = state.wishlist.filter(w => w.id !== id);
        saveData();
    }
}

function renderWishlist() {
    const list = (owner) => {
        const items = state.wishlist.filter(w => w.owner === owner);
        if (items.length === 0) return '';
        
        let html = '';
        let lastPriority = null;
        
        items.forEach(w => {
            // Add separator when priority changes
            if (lastPriority !== null && lastPriority !== w.priority) {
                html += '<div class="border-t border-white/10 my-3"></div>';
            }
            lastPriority = w.priority;
            
            const priorityClass = w.priority === 1 ? 'priority-1-card' : w.priority === 2 ? 'priority-2-card' : 'priority-3-card';
            const badgeClass = w.priority === 1 ? 'priority-1-badge' : w.priority === 2 ? 'priority-2-badge' : 'priority-3-badge';
            
            html += `
                <div class="wish-card flex items-center justify-between mb-3 ${priorityClass}">
                    <div class="flex items-center gap-4 flex-1">
                        <div class="relative">
                            <img src="${w.img}" class="w-14 h-14 rounded-2xl object-cover shadow-sm" onclick="window.open('${w.link}','_blank')">
                            <span class="absolute -top-2 -left-2 priority-badge ${badgeClass}">P${w.priority}</span>
                        </div>
                        <div class="flex-1">
                            <h4 class="text-xs font-bold text-white truncate w-32">${w.item}</h4>
                            <p class="text-sm font-black text-pink-500">${w.price}k</p>
                            ${w.notes ? `<p class="text-[9px] text-slate-300 truncate mt-1">📝 ${w.notes}</p>` : ''}
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="purchaseWish(${w.id})" class="purchase-btn"><i class="fa-solid fa-check"></i></button>
                        <button onclick="deleteWish(${w.id})" class="delete-btn"><i class="fa-solid fa-trash-can text-[10px]"></i></button>
                    </div>
                </div>
            `;
        });
        
        return html;
    };
    
    // Calculate totals
    const phuongWishes = state.wishlist.filter(w => w.owner === 'Phương');
    const sonWishes = state.wishlist.filter(w => w.owner === 'Sơn');
    const phuongTotal = phuongWishes.reduce((sum, w) => sum + w.price, 0);
    const sonTotal = sonWishes.reduce((sum, w) => sum + w.price, 0);

    document.getElementById('wishlist-phuong').innerHTML = `<div class="ml-4 mb-3 flex justify-between items-center"><p class="text-[10px] font-black uppercase text-pink-400 tracking-widest">🌸 My Beautiful Phương</p><span class="text-[10px] font-black text-pink-300">${phuongTotal}k</span></div>${list('Phương') || '<p class="text-center text-xs text-slate-300 pb-4">Make a wish, darling 💕</p>'}`;
    document.getElementById('wishlist-son').innerHTML = `<div class="ml-4 mb-3 flex justify-between items-center"><p class="text-[10px] font-black uppercase text-blue-400 tracking-widest">🐻 My Handsome Sơn</p><span class="text-[10px] font-black text-blue-300">${sonTotal}k</span></div>${list('Sơn') || '<p class="text-center text-xs text-slate-300 pb-4">Dream big, my love ✨</p>'}`;
    
    document.getElementById('wishlist-bought').innerHTML = (state.wishlistBought || []).slice(0, 10).map(w => `
        <div class="bg-white p-3 rounded-3xl text-center border border-slate-50">
            <img src="${w.img}" class="w-10 h-10 rounded-full mx-auto mb-2 grayscale opacity-50">
            <p class="text-[9px] font-bold truncate text-slate-400">${w.item}</p>
        </div>
    `).join('');
}

function renderHistory() {
    const container = document.getElementById('monthly-history-container');
    container.innerHTML = Object.keys(state.months).sort().reverse().map(mid => {
        const m = state.months[mid];
        return `
            <div class="glass p-6">
                <div class="flex justify-between items-center mb-4">
                    <div class="flex items-center gap-2">
                        <h3 class="font-black text-white">${mid}</h3>
                        <button onclick="deleteMonth('${mid}')" class="text-slate-300 hover:text-red-400 transition-colors"><i class="fa-solid fa-trash text-xs"></i></button>
                    </div>
                    <p class="text-xs font-bold text-pink-500">Spent ${(m.initial - m.budget)}k</p>
                </div>
                <div class="space-y-3">
                    ${m.logs.slice(0, 5).map(l => `
                        <div class="flex justify-between items-center bg-white/50 p-2 rounded-xl">
                            <div class="flex-1">
                                <span class="text-[10px] font-bold text-slate-600 block">${l.detail || l.cat}</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <span class="text-[10px] font-black text-slate-800">-${l.amt}k</span>
                                <button onclick="editHistoryItem('${mid}', ${m.logs.indexOf(l)})" class="text-slate-400 hover:text-blue-500"><i class="fa-solid fa-pen text-[9px]"></i></button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }).join('');
}

window.deleteMonth = function(mid) {
    if(confirm(`⚠️ Are you sure you want to delete all history for ${mid}?`)) {
        delete state.months[mid];
        if (state.currentMonthId === mid) state.currentMonthId = "";
        saveData();
    }
}

window.editHistoryItem = function(mid, index) {
    const m = state.months[mid];
    const log = m.logs[index];
    if (!log) return;

    const newAmtStr = prompt("Update Amount (k):", log.amt);
    if (newAmtStr === null) return; 
    
    const newDetail = prompt("Update Description:", log.detail || log.cat);
    if (newDetail === null) return;

    const oldAmt = log.amt;
    const newAmt = parseInt(newAmtStr) || 0;

    // Revert old transaction logic
    m.budget += oldAmt;
    if (m.spending[log.cat]) m.spending[log.cat] -= oldAmt;

    // Apply new transaction logic
    m.budget -= newAmt;
    if (m.spending[log.cat]) m.spending[log.cat] += newAmt;

    // Update log
    log.amt = newAmt;
    log.detail = newDetail;

    saveData();
}

window.openLogModal = function(cat) {
    document.getElementById('log-modal').classList.remove('hidden');
    document.getElementById('modal-title').innerText = `Spending on ${cat}`;
    document.getElementById('modal-amount-input').value = '';
    document.getElementById('modal-confirm').onclick = () => {
        const typedAmt = parseInt(document.getElementById('modal-amount-input').value);
        const selectedAmt = parseInt(document.getElementById('modal-amount').value);
        const amt = typedAmt || selectedAmt;
        
        if (!amt || amt <= 0) {
            alert("Please enter or select an amount 💰");
            return;
        }
        
        const cur = state.months[getMonthId()];
        cur.budget -= amt;
        cur.spending[cat === 'Eating' ? 'Eating' : 'Going Out'] += amt;
        cur.logs.unshift({ cat, amt, time: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) });
        closeLogModal(); saveData();
    };
}

window.closeLogModal = function() { document.getElementById('log-modal').classList.add('hidden'); }

function populatePriceRanges() {
    // Populate wishlist price range dropdown (50k increments)
    const wishPriceRange = document.getElementById('wish-price-range');
    if (wishPriceRange) {
        wishPriceRange.innerHTML = '<option value="">Quick select...</option>';
        for (let i = 50; i <= 10000; i += 50) {
            let opt = document.createElement('option');
            opt.value = i;
            opt.innerText = i + 'k';
            wishPriceRange.appendChild(opt);
        }
        // Auto-fill input when dropdown is selected
        wishPriceRange.addEventListener('change', function() {
            if (this.value) {
                document.getElementById('wish-price-input').value = this.value;
                this.value = '';
            }
        });
    }
    
    // Populate modal amount dropdown (50k increments)
    const modalAmount = document.getElementById('modal-amount');
    if (modalAmount) {
        modalAmount.innerHTML = '<option value="">Quick select...</option>';
        for (let i = 50; i <= 10000; i += 50) {
            let opt = document.createElement('option');
            opt.value = i;
            opt.innerText = i + 'k';
            modalAmount.appendChild(opt);
        }
        // Auto-fill input when dropdown is selected
        modalAmount.addEventListener('change', function() {
            if (this.value) {
                document.getElementById('modal-amount-input').value = this.value;
                this.value = '';
            }
        });
    }
}

function showToast(message) {
    const existingToast = document.querySelector('.toast');
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerText = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.remove(), 3000);
}

function displayCoupleId() {
    const coupleIdDisplay = document.getElementById('couple-id-display');
    if (coupleIdDisplay) {
        const key = localStorage.getItem('couple_sync_key');
        coupleIdDisplay.innerText = key || 'Loading...';
    }
}

window.copyCoupleId = function() {
    const key = localStorage.getItem('couple_sync_key');
    if (!key) {
        showToast('No key found 💔');
        return;
    }
    navigator.clipboard.writeText(key).then(() => {
        showToast('✅ Key copied to clipboard!');
    }).catch(() => {
        showToast('Failed to copy 😅');
    });
}

window.showTab = function(t) {
    document.querySelectorAll('.tab-content').forEach(x => x.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(x => x.classList.remove('active'));
    document.getElementById(t).classList.add('active');
    const navBtn = document.querySelector(`[data-tab="${t}"]`);
    if (navBtn) navBtn.classList.add('active');
    if(t === 'dashboard') initChart();
}

let chartInstance;
function initChart() {
    const cur = state.months[getMonthId()];
    if (!cur) return;
    const canvas = document.getElementById('spendingChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (chartInstance) chartInstance.destroy();
    chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Eating', 'Dates', 'Shopping'],
            datasets: [{
                data: [cur.spending.Eating, cur.spending['Going Out'], cur.spending.Shopping || 0],
                backgroundColor: ['#fb923c', '#60a5fa', '#f472b6'],
                borderWidth: 0, cutout: '82%'
            }]
        },
        options: { plugins: { legend: { display: false } }, maintainAspectRatio: false }
    });
}

function createHeart() {
    const c = document.getElementById('heart-container');
    if (!c) return;
    const h = document.createElement('div');
    h.classList.add('heart', 'fa-solid', 'fa-heart');
    h.style.left = Math.random() * 100 + "vw";
    h.style.fontSize = (Math.random() * 15 + 10) + "px";
    h.style.color = Math.random() > 0.5 ? 'rgba(244, 114, 182, 0.2)' : 'rgba(96, 165, 250, 0.2)';
    c.appendChild(h);
    setTimeout(() => h.remove(), 10000);
}

setInterval(createHeart, 2500);

// Start Up
populatePriceRanges();