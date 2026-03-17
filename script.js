import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, doc, onSnapshot, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyClLkwaOfg91vUecvKo9Y-23LCshMxf_Ew",
    authDomain: "wishlist-92933.firebaseapp.com",
    projectId: "wishlist-92933",
    storageBucket: "wishlist-92933.firebasestorage.app",
    messagingSenderId: "344178206479",
    appId: "1:344178206479:web:04eac3ff111bdae63dc07a"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const docRef = doc(db, "relationships", "son-phuong");

const FIRST_DATE = "2022-05-17";
let state = { currentMonthId: "", months: {}, wishlist: [], wishlistBought: [] };
let chart;

// INITIALIZE CLOUD LISTENER (Real-time Sync)
onSnapshot(docRef, (snap) => {
    if (snap.exists()) {
        state = snap.data();
        updateUI();
    } else {
        // Initialize first time
        setDoc(docRef, state);
    }
});

function getMonthId() {
    const d = new Date();
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
}

async function checkMonthlyReset() {
    const mid = getMonthId();
    if (state.currentMonthId !== mid) {
        state.currentMonthId = mid;
        if (!state.months[mid]) {
            state.months[mid] = { budget: 0, initial: 0, logs: [], spending: { Eating: 0, "Going Out": 0, Shopping: 0 } };
            document.getElementById('current-month-name').innerText = new Date().toLocaleDateString('vi-VN', {month: 'long'});
            document.getElementById('setup-overlay').classList.remove('hidden');
        }
        await saveData();
    }
}

async function finishSetup() {
    const b = parseInt(document.getElementById('setup-budget').value);
    if (b > 0) {
        state.months[getMonthId()].budget = b;
        state.months[getMonthId()].initial = b;
        document.getElementById('setup-overlay').classList.add('hidden');
        await saveData();
    }
}

async function saveData() {
    await updateDoc(docRef, state);
}

function updateUI() {
    checkMonthlyReset();
    const cur = state.months[getMonthId()];
    if (!cur) return;

    document.getElementById('display-budget').innerText = `${cur.budget.toLocaleString()}k`;
    document.getElementById('total-spent').innerText = `${(cur.initial - cur.budget).toLocaleString()}k`;
    
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    document.getElementById('days-left-count').innerText = `${lastDay - now.getDate()} days`;

    const diff = Math.floor((now - new Date(FIRST_DATE)) / (1000 * 60 * 60 * 24));
    document.getElementById('days-count-top').innerText = `Day ${diff} of Love`;
    document.getElementById('days-together-footer').innerText = `${diff} Days Together ❤️`;

    const fill = (cur.budget / cur.initial) * 100;
    document.getElementById('health-bar-fill').style.width = `${Math.max(0, fill)}%`;

    renderWishlist();
    renderHistory();
    if (chart) updateChart();
}

// Global functions for HTML access
window.addWish = async function() {
    const itemInput = document.getElementById('wish-item');
    const link = document.getElementById('wish-link').value;
    const btn = document.getElementById('add-wish-btn');
    btn.disabled = true;

    let img = "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=200";
    if (link) {
        try {
            const res = await fetch(`https://api.microlink.io?url=${encodeURIComponent(link)}`);
            const data = await res.json();
            if (data.status === 'success') img = data.data.image?.url || img;
        } catch (e) {}
    }

    state.wishlist.push({
        id: Date.now(),
        item: itemInput.value || "Gift Idea",
        price: parseInt(document.getElementById('wish-price').value),
        priority: parseInt(document.getElementById('wish-priority').value),
        owner: document.getElementById('wish-owner').value,
        link, img
    });
    
    state.wishlist.sort((a, b) => a.priority - b.priority);
    itemInput.value = ''; document.getElementById('wish-link').value = '';
    btn.disabled = false;
    await saveData();
};

window.purchaseWish = async function(id) {
    const idx = state.wishlist.findIndex(w => w.id === id);
    const item = state.wishlist[idx];
    if (confirm(`Buying "${item.item}"? -${item.price}k`)) {
        const cur = state.months[getMonthId()];
        cur.budget -= item.price;
        cur.spending.Shopping = (cur.spending.Shopping || 0) + item.price;
        cur.logs.unshift({ cat: 'Shopping', amt: item.price, detail: item.item, time: 'Just now' });
        state.wishlistBought.unshift({...item, date: new Date().toLocaleDateString()});
        state.wishlist.splice(idx, 1);
        await saveData();
    }
};

window.deleteWish = async function(id) {
    if (confirm("Delete this wish permanently?")) {
        state.wishlist = state.wishlist.filter(w => w.id !== id);
        await saveData();
    }
};

function renderWishlist() {
    const list = (owner) => state.wishlist.filter(w => w.owner === owner).map(w => `
        <div class="wish-card ${w.priority === 1 ? 'priority-1-card' : ''}">
            <div class="flex items-center gap-3">
                <img src="${w.img}" class="w-12 h-12 rounded-xl object-cover" onclick="window.open('${w.link}','_blank')">
                <div>
                    ${w.priority === 1 ? '<span class="p-badge p-1">TOP PRIORITY</span>' : ''}
                    <h4 class="text-xs font-bold truncate w-24">${w.item}</h4>
                    <p class="text-xs font-black text-pink-500">${w.price}k</p>
                </div>
            </div>
            <div class="flex gap-2">
                <button onclick="purchaseWish(${w.id})" class="purchase-btn"><i class="fa-solid fa-check"></i></button>
                <button onclick="deleteWish(${w.id})" class="delete-btn"><i class="fa-solid fa-trash-can"></i></button>
            </div>
        </div>
    `).join('');

    document.getElementById('wishlist-phuong').innerHTML = `<p class="ml-4 text-[10px] font-black text-pink-400 mb-2 uppercase">👸 Phương</p>${list('Phương')}`;
    document.getElementById('wishlist-son').innerHTML = `<p class="ml-4 text-[10px] font-black text-blue-400 mb-2 mt-4 uppercase">🤵‍♂️ Sơn</p>${list('Sơn')}`;
    
    document.getElementById('wishlist-bought').innerHTML = state.wishlistBought.slice(0, 4).map(w => `
        <div class="bg-white p-3 rounded-2xl text-center grayscale border border-slate-50">
            <p class="text-[9px] font-bold truncate">${w.item}</p>
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
                    <h3 class="font-black">${mid}</h3>
                    <p class="text-xs font-bold text-pink-500">Spent ${m.initial - m.budget}k</p>
                </div>
                ${m.logs.slice(0,3).map(l => `<div class="flex justify-between text-[10px] opacity-60"><span>${l.detail || l.cat}</span><span>-${l.amt}k</span></div>`).join('')}
            </div>
        `;
    }).join('');
}

window.openLogModal = function(cat) {
    document.getElementById('log-modal').classList.remove('hidden');
    document.getElementById('modal-confirm').onclick = async () => {
        const amt = parseInt(document.getElementById('modal-amount').value);
        const cur = state.months[getMonthId()];
        cur.budget -= amt;
        cur.spending[cat === 'Eating' ? 'Eating' : 'Going Out'] += amt;
        cur.logs.unshift({ cat, amt, time: new Date().toLocaleTimeString() });
        document.getElementById('log-modal').classList.add('hidden');
        await saveData();
    };
};

window.closeLogModal = () => document.getElementById('log-modal').classList.add('hidden');

window.showTab = function(t) {
    document.querySelectorAll('.tab-content').forEach(x => x.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(x => x.classList.remove('active'));
    document.getElementById(t).classList.add('active');
    document.querySelector(`[data-tab="${t}"]`).classList.add('active');
    if(t === 'dashboard') initChart();
};

function initChart() {
    const cur = state.months[getMonthId()];
    const ctx = document.getElementById('spendingChart').getContext('2d');
    if (chart) chart.destroy();
    chart = new Chart(ctx, {
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

function updateChart() {
    const cur = state.months[getMonthId()];
    chart.data.datasets[0].data = [cur.spending.Eating, cur.spending['Going Out'], cur.spending.Shopping || 0];
    chart.update();
}

// Populate dropdowns
const els = [document.getElementById('wish-price'), document.getElementById('modal-amount')];
els.forEach(el => {
    for(let i=0; i<=10000; i+=50) {
        let opt = document.createElement('option'); opt.value = i; opt.innerText = i + "k"; el.appendChild(opt);
    }
});

// Floating Hearts
setInterval(() => {
    const c = document.getElementById('heart-container');
    const h = document.createElement('div');
    h.classList.add('heart', 'fa-solid', 'fa-heart');
    h.style.left = Math.random() * 100 + "vw";
    h.style.fontSize = (Math.random() * 15 + 10) + "px";
    c.appendChild(h);
    setTimeout(() => h.remove(), 10000);
}, 2500);

window.resetApp = async () => { if(confirm("Wipe all cloud data?")) { state = { currentMonthId: "", months: {}, wishlist: [], wishlistBought: [] }; await saveData(); location.reload(); } };