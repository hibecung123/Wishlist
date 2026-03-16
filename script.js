const state = JSON.parse(localStorage.getItem('couple_pro_data')) || {
    budget: 0,
    mealsLeft: 30,
    datesLeft: 4,
    wishlist: [],
    logs: [],
    spending: { Eating: 0, Shopping: 0, "Going Out": 0 }
};

let chart;

function saveData() {
    localStorage.setItem('couple_pro_data', JSON.stringify(state));
    updateUI();
}

function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active');
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
    
    if (tabId === 'dashboard') initChart();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- LOGIC ---
function deductQuick(cat) {
    const amount = parseFloat(prompt(`Amount for ${cat}? (Current avg is used if empty)`));
    const finalAmount = amount || (cat === 'Eating' ? (state.budget / state.mealsLeft) : (state.budget / state.datesLeft));
    
    if (finalAmount) {
        state.budget -= finalAmount;
        state.spending[cat] += finalAmount;
        if (cat === 'Eating') state.mealsLeft--;
        else state.datesLeft--;
        
        state.logs.unshift({
            id: Date.now(),
            date: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            category: cat,
            amount: finalAmount,
            title: cat === 'Eating' ? "Yummy Meal" : "Romantic Date"
        });
        saveData();
    }
}

async function addWish() {
    const item = document.getElementById('wish-item').value;
    const price = parseFloat(document.getElementById('wish-price').value);
    const owner = document.getElementById('wish-owner').value;
    const link = document.getElementById('wish-link').value;

    if (item && price) {
        let img = "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=400&q=80"; // Default image
        if (link) {
            try {
                const res = await fetch(`https://api.microlink.io?url=${encodeURIComponent(link)}`);
                const data = await res.json();
                if (data.status === 'success') img = data.data.image.url;
            } catch (e) { console.log("Preview unavailable"); }
        }

        state.wishlist.push({ id: Date.now(), item, price, owner, img, bought: false });
        document.getElementById('wish-item').value = '';
        document.getElementById('wish-price').value = '';
        saveData();
    }
}

function deleteWish(id) {
    state.wishlist = state.wishlist.filter(w => w.id !== id);
    saveData();
}

function updateUI() {
    document.getElementById('display-budget').innerText = new Intl.NumberFormat('vi-VN').format(state.budget) + " ₫";
    document.getElementById('avg-meal-budget').innerText = new Intl.NumberFormat('vi-VN').format(state.budget / (state.mealsLeft || 1)) + " ₫";
    document.getElementById('avg-date-budget').innerText = new Intl.NumberFormat('vi-VN').format(state.budget / (state.datesLeft || 1)) + " ₫";
    
    document.getElementById('meals-left-label').innerText = `${state.mealsLeft} Left`;
    document.getElementById('dates-left-label').innerText = `${state.datesLeft} Left`;

    // Wishlist Rendering
    const renderWish = (w) => `
        <div class="bg-white rounded-[2rem] overflow-hidden shadow-sm border border-slate-100 p-2">
            <img src="${w.img}" class="w-full h-32 object-cover rounded-[1.5rem] mb-3">
            <div class="px-2 pb-2">
                <h4 class="text-xs font-bold text-slate-800 truncate">${w.item}</h4>
                <p class="text-[10px] text-rose-500 font-black mb-2">${new Intl.NumberFormat('vi-VN').format(w.price)} ₫</p>
                <div class="flex justify-between">
                    <button onclick="deleteWish(${w.id})" class="text-slate-300 hover:text-red-500"><i class="fa-solid fa-trash-can text-[10px]"></i></button>
                    <button class="bg-slate-100 text-[9px] px-3 py-1 rounded-full font-bold">Buy</button>
                </div>
            </div>
        </div>
    `;

    document.getElementById('wishlist-son').innerHTML = state.wishlist.filter(w => w.owner === 'Sơn').map(renderWish).join('');
    document.getElementById('wishlist-phuong').innerHTML = state.wishlist.filter(w => w.owner === 'Phương').map(renderWish).join('');

    // History Rendering
    document.getElementById('log-list').innerHTML = state.logs.map(l => `
        <div class="glass p-4 rounded-2xl flex justify-between items-center border border-white">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full flex items-center justify-center ${l.category === 'Eating' ? 'bg-orange-100 text-orange-600' : 'bg-teal-100 text-teal-600'}">
                    <i class="fa-solid ${l.category === 'Eating' ? 'fa-bowl-food' : 'fa-star'}"></i>
                </div>
                <div>
                    <p class="text-sm font-bold text-slate-800">${l.title}</p>
                    <p class="text-[9px] text-slate-400 font-bold uppercase">${l.date}</p>
                </div>
            </div>
            <p class="font-black text-slate-800">-${new Intl.NumberFormat('vi-VN').format(l.amount)} ₫</p>
        </div>
    `).join('');

    if (chart) updateChart();
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
                borderWidth: 8,
                borderColor: '#ffffff'
            }]
        },
        options: {
            cutout: '80%',
            plugins: { legend: { display: false } },
            maintainAspectRatio: false
        }
    });
}

function updateChart() {
    chart.data.datasets[0].data = [state.spending.Eating, state.spending['Going Out'], state.spending.Shopping];
    chart.update();
}

function spawnHeart() {
    const h = document.createElement('div');
    h.className = 'heart fa-solid fa-heart';
    h.style.left = Math.random() * 100 + 'vw';
    h.style.color = `rgba(244, 63, 94, ${Math.random() * 0.4})`;
    h.style.fontSize = Math.random() * 20 + 10 + 'px';
    document.getElementById('heart-container').appendChild(h);
    setTimeout(() => h.remove(), 8000);
}

setInterval(spawnHeart, 2000);
window.onload = () => { updateUI(); initChart(); };