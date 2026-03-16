const state = JSON.parse(localStorage.getItem('couple_v7_k')) || {
    isConfigured: false,
    budget: 0,
    initialBudget: 0,
    wishlist: [],
    logs: [],
    spending: { Eating: 0, "Going Out": 0, Shopping: 0 }
};

let chart;

function saveData() {
    localStorage.setItem('couple_v7_k', JSON.stringify(state));
    updateUI();
}

function finishSetup() {
    const b = parseInt(document.getElementById('setup-budget').value);
    if (b > 0) {
        state.budget = b;
        state.initialBudget = b;
        state.isConfigured = true;
        document.getElementById('setup-overlay').classList.add('hidden');
        saveData();
    }
}

function populateRanges() {
    const ids = ['wish-price', 'modal-amount'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.innerHTML = '';
        for (let i = 0; i <= 10000; i += 50) {
            const opt = document.createElement('option');
            opt.value = i;
            opt.innerText = `${i}k`;
            el.appendChild(opt);
        }
    });
}

function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    const btn = document.querySelector(`[data-tab="${tabId}"]`);
    if(btn) btn.classList.add('active');
    if (tabId === 'dashboard') initChart();
}

function openLogModal(cat) {
    document.getElementById('log-modal').classList.remove('hidden');
    document.getElementById('modal-title').innerText = `Log ${cat}`;
    document.getElementById('modal-confirm').onclick = () => {
        const amt = parseInt(document.getElementById('modal-amount').value);
        state.budget -= amt;
        state.spending[cat === 'Eating' ? 'Eating' : 'Going Out'] += amt;
        state.logs.unshift({
            id: Date.now(),
            cat: cat,
            amt: amt,
            time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        });
        closeLogModal();
        saveData();
    };
}

function closeLogModal() { document.getElementById('log-modal').classList.add('hidden'); }

async function addWish() {
    const itemInput = document.getElementById('wish-item');
    const price = parseInt(document.getElementById('wish-price').value);
    const priority = parseInt(document.getElementById('wish-priority').value);
    const link = document.getElementById('wish-link').value;
    const owner = document.getElementById('wish-owner').value;
    const btn = document.getElementById('add-wish-btn');

    btn.innerText = "🔍 Fetching...";
    btn.disabled = true;

    let finalName = itemInput.value;
    let img = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400";

    if (link) {
        try {
            const res = await fetch(`https://api.microlink.io?url=${encodeURIComponent(link)}`);
            const data = await res.json();
            if (data.status === 'success') {
                img = data.data.image ? data.data.image.url : img;
                if (!finalName) finalName = data.data.title;
            }
        } catch (e) { console.log(e); }
    }

    state.wishlist.push({ id: Date.now(), item: finalName || "Gift", price, priority, owner, link, img });
    state.wishlist.sort((a, b) => a.priority - b.priority);
    
    itemInput.value = ''; document.getElementById('wish-link').value = '';
    btn.innerText = "Save Wish"; btn.disabled = false;
    saveData();
}

// --- NEW LOGIC FOR WISHLIST ACTIONS ---

function purchaseWish(id) {
    const item = state.wishlist.find(w => w.id === id);
    if (confirm(`Mua "${item.item}" với giá ${item.price}k?`)) {
        state.budget -= item.price;
        state.spending.Shopping += item.price;
        state.logs.unshift({
            id: Date.now(),
            cat: 'Shopping',
            amt: item.price,
            time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            detail: `Wishlist: ${item.item}`
        });
        state.wishlist = state.wishlist.filter(w => w.id !== id);
        saveData();
    }
}

function deleteWish(id) {
    if(confirm("Xóa?")) {
        state.wishlist = state.wishlist.filter(w => w.id !== id);
        saveData();
    }
}

// --- UI UPDATES ---

function updateUI() {
    if (!state.isConfigured) document.getElementById('setup-overlay').classList.remove('hidden');
    document.getElementById('display-budget').innerText = Math.round(state.budget).toLocaleString() + "k";
    document.getElementById('total-spent').innerText = Math.round(state.initialBudget - state.budget).toLocaleString() + "k";
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    document.getElementById('days-left-count').innerText = lastDay - now.getDate();

    renderWishlist();
    renderHistory();
    if (chart) updateChart();
}

function renderWishlist() {
    const list = (owner) => state.wishlist.filter(w => w.owner === owner).map(w => `
        <div class="bg-white rounded-[2rem] overflow-hidden shadow-sm border border-slate-100 ${w.priority === 1 ? 'priority-1' : ''}">
            <img src="${w.img}" class="w-full h-32 object-cover" onclick="window.open('${w.link || '#'}', '_blank')">
            <div class="p-4 flex justify-between items-center">
                <div class="max-w-[50%]">
                    <p class="text-[8px] font-black text-amber-500">P${w.priority}</p>
                    <h4 class="text-xs font-bold text-slate-800 truncate">${w.item}</h4>
                </div>
                <div class="flex items-center gap-3">
                    <p class="font-black text-rose-500 text-sm mr-1">${w.price}k</p>
                    <button onclick="purchaseWish(${w.id})" class="purchase-btn"><i class="fa-solid fa-check text-xs"></i></button>
                    <button onclick="deleteWish(${w.id})" class="delete-btn"><i class="fa-solid fa-xmark text-xs"></i></button>
                </div>
            </div>
        </div>
    `).join('');
    document.getElementById('wishlist-phuong').innerHTML = `<p class="ml-4 text-[10px] font-black uppercase text-rose-400 mb-2">👸 Phương's Desires</p>${list('Phương') || '<p class="text-center text-xs text-slate-300">Empty</p>'}`;
    document.getElementById('wishlist-son').innerHTML = `<p class="ml-4 text-[10px] font-black uppercase text-slate-400 mb-2 mt-4">🤵‍♂️ Sơn's Desires</p>${list('Sơn') || '<p class="text-center text-xs text-slate-300">Empty</p>'}`;
}

function renderHistory() {
    document.getElementById('log-list').innerHTML = state.logs.map(l => `
        <div class="bg-white p-4 rounded-2xl flex justify-between items-center shadow-sm">
            <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full flex items-center justify-center ${l.cat === 'Eating' ? 'bg-orange-100 text-orange-600' : 'bg-teal-100 text-teal-600'}">
                    <i class="fa-solid ${l.cat === 'Eating' ? 'fa-bowl-food' : (l.cat === 'Shopping' ? 'fa-bag-shopping' : 'fa-wine-glass')} text-[10px]"></i>
                </div>
                <div><p class="text-xs font-bold">${l.detail || l.cat}</p><p class="text-[8px] font-bold text-slate-400">${l.time}</p></div>
            </div>
            <p class="font-black text-slate-700">-${l.amt}k</p>
        </div>
    `).join('');
}

function initChart() {
    const ctx = document.getElementById('spendingChart').getContext('2d');
    if (chart) chart.destroy();
    chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Eating', 'Dates', 'Shopping'],
            datasets: [{
                data: [state.spending.Eating, state.spending['Going Out'], state.spending.Shopping],
                backgroundColor: ['#f97316', '#14b8a6', '#f43f5e'],
                borderWidth: 0, cutout: '80%'
            }]
        },
        options: { plugins: { legend: { display: false } }, maintainAspectRatio: false }
    });
}

function updateChart() {
    chart.data.datasets[0].data = [state.spending.Eating, state.spending['Going Out'], state.spending.Shopping];
    chart.update();
}

function resetApp() { if(confirm("Clear all?")) { localStorage.clear(); location.reload(); } }

window.onload = () => { populateRanges(); updateUI(); initChart(); };