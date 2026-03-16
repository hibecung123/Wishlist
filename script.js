const FIRST_DATE = "2022-05-17";

const state = JSON.parse(localStorage.getItem('couple_v11_love')) || {
    currentMonthId: "", 
    months: {}, 
    wishlist: [],
    wishlistBought: []
};

let chart;

function getMonthId() {
    const d = new Date();
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
}

function checkMonthlyReset() {
    const mid = getMonthId();
    if (state.currentMonthId !== mid) {
        state.currentMonthId = mid;
        if (!state.months[mid]) {
            state.months[mid] = { budget: 0, initial: 0, logs: [], spending: { Eating: 0, "Going Out": 0, Shopping: 0 } };
            document.getElementById('current-month-name').innerText = new Date().toLocaleDateString('vi-VN', {month: 'long', year: 'numeric'});
            document.getElementById('setup-overlay').classList.remove('hidden');
        }
    }
}

function finishSetup() {
    const b = parseInt(document.getElementById('setup-budget').value);
    if (b > 0) {
        state.months[getMonthId()].budget = b;
        state.months[getMonthId()].initial = b;
        document.getElementById('setup-overlay').classList.add('hidden');
        saveData();
    }
}

function updateUI() {
    checkMonthlyReset();
    const cur = state.months[getMonthId()];
    if (!cur) return;

    // Budget Update
    document.getElementById('display-budget').innerText = `${cur.budget.toLocaleString()}k`;
    document.getElementById('total-spent').innerText = `${(cur.initial - cur.budget).toLocaleString()}k`;
    
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    document.getElementById('days-left-count').innerText = `${lastDay - now.getDate()} days`;

    // Love Counter
    const diff = Math.floor((now - new Date(FIRST_DATE)) / (1000 * 60 * 60 * 24));
    document.getElementById('days-count-top').innerText = `Day ${diff} of our journey`;
    document.getElementById('days-together-footer').innerText = `${diff} Days Together`;

    const fill = (cur.budget / cur.initial) * 100;
    document.getElementById('health-bar-fill').style.width = `${Math.max(0, fill)}%`;

    renderWishlist();
    renderHistory();
    if (chart) updateChart();
}

async function addWish() {
    const itemInput = document.getElementById('wish-item');
    const price = parseInt(document.getElementById('wish-price').value);
    const link = document.getElementById('wish-link').value;
    const btn = document.getElementById('add-wish-btn');

    btn.innerText = "✨ Adding Magic..."; btn.disabled = true;
    let img = "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=400";
    let name = itemInput.value;

    if (link) {
        try {
            const res = await fetch(`https://api.microlink.io?url=${encodeURIComponent(link)}`);
            const data = await res.json();
            if (data.status === 'success') {
                img = data.data.image?.url || img;
                if (!name) name = data.data.title;
            }
        } catch (e) {}
    }

    state.wishlist.push({
        id: Date.now(),
        item: name || "Surprise Gift",
        price,
        priority: parseInt(document.getElementById('wish-priority').value),
        owner: document.getElementById('wish-owner').value,
        link, img
    });
    
    // Sort by priority (1 is highest)
    state.wishlist.sort((a, b) => a.priority - b.priority);
    
    itemInput.value = ''; document.getElementById('wish-link').value = '';
    btn.innerText = "Add to List"; btn.disabled = false;
    saveData();
}

function purchaseWish(id) {
    const idx = state.wishlist.findIndex(w => w.id === id);
    const item = state.wishlist[idx];
    if (confirm(`🎉 Yay! Buying "${item.item}"? \nBudget will minus ${item.price}k.`)) {
        const cur = state.months[getMonthId()];
        cur.budget -= item.price;
        cur.spending.Shopping = (cur.spending.Shopping || 0) + item.price;
        cur.logs.unshift({ cat: 'Shopping', amt: item.price, detail: `Gift: ${item.item}`, time: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) });
        
        state.wishlistBought.unshift({...item, boughtDate: new Date().toLocaleDateString()});
        state.wishlist.splice(idx, 1);
        saveData();
    }
}

function deleteWish(id) {
    if (confirm("⚠️ Are you sure you want to delete this wish? This cannot be undone.")) {
        state.wishlist = state.wishlist.filter(w => w.id !== id);
        saveData();
    }
}

function renderWishlist() {
    const list = (owner) => state.wishlist.filter(w => w.owner === owner).map(w => `
        <div class="wish-card flex items-center justify-between mb-3 ${w.priority === 1 ? 'priority-1-card' : ''}">
            <div class="flex items-center gap-4">
                <div class="relative">
                    <img src="${w.img}" class="w-14 h-14 rounded-2xl object-cover shadow-sm" onclick="window.open('${w.link}','_blank')">
                    <span class="absolute -top-2 -left-2 priority-badge ${w.priority === 1 ? 'priority-1-badge' : 'bg-slate-100 text-slate-500'}">P${w.priority}</span>
                </div>
                <div>
                    <h4 class="text-xs font-bold text-slate-800 truncate w-32">${w.item}</h4>
                    <p class="text-sm font-black text-pink-500">${w.price}k</p>
                </div>
            </div>
            <div class="flex gap-2">
                <button onclick="purchaseWish(${w.id})" class="purchase-btn"><i class="fa-solid fa-check"></i></button>
                <button onclick="deleteWish(${w.id})" class="delete-btn"><i class="fa-solid fa-trash-can text-[10px]"></i></button>
            </div>
        </div>
    `).join('');

    document.getElementById('wishlist-phuong').innerHTML = `<p class="ml-4 text-[10px] font-black uppercase text-pink-400 mb-3 tracking-widest">👸 For Phương</p>${list('Phương') || '<p class="text-center text-xs text-slate-300 pb-4">No wishes yet</p>'}`;
    document.getElementById('wishlist-son').innerHTML = `<p class="ml-4 text-[10px] font-black uppercase text-blue-400 mb-3 tracking-widest">🤵‍♂️ For Sơn</p>${list('Sơn') || '<p class="text-center text-xs text-slate-300 pb-4">No wishes yet</p>'}`;
    
    document.getElementById('wishlist-bought').innerHTML = state.wishlistBought.slice(0, 10).map(w => `
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
                    <h3 class="font-black text-slate-800">${mid}</h3>
                    <p class="text-xs font-bold text-pink-500">Spent ${(m.initial - m.budget)}k</p>
                </div>
                <div class="space-y-3">
                    ${m.logs.slice(0, 5).map(l => `
                        <div class="flex justify-between items-center bg-white/50 p-2 rounded-xl">
                            <span class="text-[10px] font-bold text-slate-600">${l.detail || l.cat}</span>
                            <span class="text-[10px] font-black text-slate-800">-${l.amt}k</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }).join('');
}

function openLogModal(cat) {
    document.getElementById('log-modal').classList.remove('hidden');
    document.getElementById('modal-title').innerText = `Spending on ${cat}`;
    document.getElementById('modal-confirm').onclick = () => {
        const amt = parseInt(document.getElementById('modal-amount').value);
        const cur = state.months[getMonthId()];
        cur.budget -= amt;
        cur.spending[cat === 'Eating' ? 'Eating' : 'Going Out'] += amt;
        cur.logs.unshift({ cat, amt, time: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) });
        closeLogModal(); saveData();
    };
}

function closeLogModal() { document.getElementById('log-modal').classList.add('hidden'); }

function populateRanges() {
    const els = [document.getElementById('wish-price'), document.getElementById('modal-amount')];
    els.forEach(el => {
        for(let i=0; i<=10000; i+=50) {
            let opt = document.createElement('option'); opt.value = i; opt.innerText = i + "k"; el.appendChild(opt);
        }
    });
}

function showTab(t) {
    document.querySelectorAll('.tab-content').forEach(x => x.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(x => x.classList.remove('active'));
    document.getElementById(t).classList.add('active');
    document.querySelector(`[data-tab="${t}"]`).classList.add('active');
    if(t === 'dashboard') initChart();
}

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

function createHeart() {
    const c = document.getElementById('heart-container');
    const h = document.createElement('div');
    h.classList.add('heart', 'fa-solid', 'fa-heart');
    h.style.left = Math.random() * 100 + "vw";
    h.style.fontSize = (Math.random() * 15 + 10) + "px";
    h.style.color = Math.random() > 0.5 ? 'rgba(244, 114, 182, 0.2)' : 'rgba(96, 165, 250, 0.2)';
    c.appendChild(h);
    setTimeout(() => h.remove(), 10000);
}

setInterval(createHeart, 2500);
function saveData() { localStorage.setItem('couple_v11_love', JSON.stringify(state)); updateUI(); }
function resetApp() { if(confirm("Wipe all data? This will delete your history and wishlist.")) { localStorage.clear(); location.reload(); } }
window.onload = () => { populateRanges(); checkMonthlyReset(); updateUI(); initChart(); };