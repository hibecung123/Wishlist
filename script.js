import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, doc, onSnapshot, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCdlxmmOecQ3NLFN1ZoDgG4CT_PWEiylgw",
    authDomain: "wishlist-a389f.firebaseapp.com",
    projectId: "wishlist-a389f",
    storageBucket: "wishlist-a389f.firebasestorage.app",
    messagingSenderId: "23434889327",
    appId: "1:23434889327:web:33d22a4a0562f6c3e4a59a",
    measurementId: "G-Y51YZX4CTG"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const FIRST_DATE = "2022-05-17"; // Your anniversary date

let state = { currentMonthId: "", months: {}, wishlist: [], wishlistBought: [] };
let docRef;
let chart;

// --- SECRET KEY LOGIN ---
window.loginWithKey = function() {
    const key = document.getElementById('couple-id-input').value.trim();
    if (key) {
        localStorage.setItem('son_phuong_id', key);
        startSync(key);
    }
};

const savedKey = localStorage.getItem('son_phuong_id');
if (savedKey) startSync(savedKey);

function startSync(key) {
    document.getElementById('login-overlay').classList.add('hidden');
    document.getElementById('app-content').classList.replace('opacity-0', 'opacity-100');
    
    docRef = doc(db, "relationships", key);
    
    onSnapshot(docRef, (snap) => {
        if (snap.exists()) {
            state = snap.data();
            updateUI();
        } else {
            setDoc(docRef, state);
        }
    });
}

// --- CORE LOGIC ---
async function saveData() { if(docRef) await updateDoc(docRef, state); }

function updateUI() {
    const mid = `${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}`;
    if (state.currentMonthId !== mid) {
        state.currentMonthId = mid;
        if (!state.months[mid]) {
            state.months[mid] = { budget: 0, initial: 0, logs: [], spending: { Eating: 0, "Going Out": 0, Shopping: 0 } };
            document.getElementById('setup-overlay').classList.remove('hidden');
        }
        saveData();
    }

    const cur = state.months[mid];
    if (!cur) return;

    document.getElementById('display-budget').innerText = `${cur.budget.toLocaleString()}k`;
    document.getElementById('total-spent').innerText = `${(cur.initial - cur.budget).toLocaleString()}k`;
    
    const diff = Math.floor((new Date() - new Date(FIRST_DATE)) / (1000 * 60 * 60 * 24));
    document.getElementById('days-count-top').innerText = `Day ${diff} of Love`;
    document.getElementById('days-together-footer').innerText = `${diff} Days Together ❤️`;

    const fill = (cur.budget / cur.initial) * 100;
    document.getElementById('health-bar-fill').style.width = `${Math.max(0, fill)}%`;

    renderWishlist();
    renderHistory();
    if (chart) updateChart();
}

window.finishSetup = async function() {
    const b = parseInt(document.getElementById('setup-budget').value);
    if (b > 0) {
        state.months[state.currentMonthId].budget = b;
        state.months[state.currentMonthId].initial = b;
        document.getElementById('setup-overlay').classList.add('hidden');
        await saveData();
    }
};

window.addWish = async function() {
    const item = document.getElementById('wish-item').value;
    const price = parseInt(document.getElementById('wish-price').value);
    const priority = parseInt(document.getElementById('wish-priority').value);
    const owner = document.getElementById('wish-owner').value;

    if(!item) return;
    state.wishlist.push({ id: Date.now(), item, price, priority, owner });
    state.wishlist.sort((a,b) => a.priority - b.priority);
    document.getElementById('wish-item').value = '';
    await saveData();
};

window.purchaseWish = async function(id) {
    const idx = state.wishlist.findIndex(w => w.id === id);
    const item = state.wishlist[idx];
    if(confirm(`Buying ${item.item}? -${item.price}k`)) {
        const cur = state.months[state.currentMonthId];
        cur.budget -= item.price;
        cur.spending.Shopping = (cur.spending.Shopping || 0) + item.price;
        cur.logs.unshift({ cat: 'Shopping', amt: item.price, detail: item.item });
        state.wishlist.splice(idx, 1);
        await saveData();
    }
};

window.deleteWish = async function(id) {
    if(confirm("Remove this wish?")) {
        state.wishlist = state.wishlist.filter(w => w.id !== id);
        await saveData();
    }
};

function renderWishlist() {
    const list = (owner) => state.wishlist.filter(w => w.owner === owner).map(w => `
        <div class="wish-card ${w.priority === 1 ? 'priority-1-card' : ''}">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center font-black text-xs text-slate-400">P${w.priority}</div>
                <div>
                    <h4 class="text-xs font-bold">${w.item}</h4>
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
}

function renderHistory() {
    const container = document.getElementById('monthly-history-container');
    container.innerHTML = Object.keys(state.months).sort().reverse().map(mid => `
        <div class="glass p-6">
            <h3 class="font-black mb-2">${mid}</h3>
            ${state.months[mid].logs.slice(0,5).map(l => `<div class="flex justify-between text-[10px] opacity-60 py-1 border-b border-black/5"><span>${l.detail || l.cat}</span><span>-${l.amt}k</span></div>`).join('')}
        </div>
    `).join('');
}

window.openLogModal = (cat) => {
    document.getElementById('log-modal').classList.remove('hidden');
    document.getElementById('modal-confirm').onclick = async () => {
        const amt = parseInt(document.getElementById('modal-amount').value);
        const cur = state.months[state.currentMonthId];
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
    const cur = state.months[state.currentMonthId];
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
    const cur = state.months[state.currentMonthId];
    chart.data.datasets[0].data = [cur.spending.Eating, cur.spending['Going Out'], cur.spending.Shopping || 0];
    chart.update();
}

// DROPDOWNS
const els = [document.getElementById('wish-price'), document.getElementById('modal-amount')];
els.forEach(el => { for(let i=0; i<=5000; i+=50) { let opt = document.createElement('option'); opt.value = i; opt.innerText = i + "k"; el.appendChild(opt); } });

// FLOATING HEARTS
setInterval(() => {
    const c = document.getElementById('heart-container');
    const h = document.createElement('div');
    h.classList.add('heart', 'fa-solid', 'fa-heart');
    h.style.left = Math.random() * 100 + "vw";
    h.style.fontSize = (Math.random() * 15 + 10) + "px";
    c.appendChild(h);
    setTimeout(() => h.remove(), 10000);
}, 3000);