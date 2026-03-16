// --- STATE MANAGEMENT ---
const fmt = (num) => new Intl.NumberFormat('vi-VN').format(num) + " ₫";

let state = JSON.parse(localStorage.getItem('coupleData')) || {
    budget: 0,
    mealsLeft: 30,
    datesLeft: 4,
    wishlist: [],
    logs: [],
    spending: { Eating: 0, Shopping: 0, "Going Out": 0 }
};

let chart;

function saveData() {
    localStorage.setItem('coupleData', JSON.stringify(state));
    updateUI();
}

// --- NAVIGATION ---
function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    if (tabId === 'dashboard') initChart();
}

// --- BUDGET & SPENDING ---
function setBudget() {
    const val = parseFloat(document.getElementById('set-total-budget').value);
    if (val) {
        state.budget = val;
        saveData();
        document.getElementById('set-total-budget').value = '';
    }
}

function calculateAverages() {
    state.mealsLeft = parseInt(document.getElementById('meals-left').value) || 1;
    state.datesLeft = parseInt(document.getElementById('dates-left').value) || 1;
    
    document.getElementById('avg-meal-budget').innerText = fmt(state.budget / state.mealsLeft);
    document.getElementById('avg-date-budget').innerText = fmt(state.budget / state.datesLeft);
}

function deductSpending(category, inputId, countId) {
    const cost = parseFloat(document.getElementById(inputId).value);
    if (cost) {
        state.budget -= cost;
        state.spending[category] += cost;
        if (category === 'Eating') state.mealsLeft -= 1;
        if (category === 'Going Out') state.datesLeft -= 1;

        state.logs.unshift({
            date: new Date().toLocaleString('vi-VN'),
            desc: category === 'Eating' ? "Meal Expense" : "Date Night",
            category,
            amount: cost
        });
        
        document.getElementById(inputId).value = '';
        saveData();
    }
}

function addManualExpense() {
    const amount = parseFloat(prompt("Enter shopping amount:"));
    if (amount) {
        state.budget -= amount;
        state.spending.Shopping += amount;
        state.logs.unshift({ 
            date: new Date().toLocaleString('vi-VN'), 
            desc: "Shopping", 
            category: "Shopping", 
            amount 
        });
        saveData();
    }
}

// --- WISHLIST LOGIC ---
async function addWish() {
    const item = document.getElementById('wish-item').value;
    const price = parseFloat(document.getElementById('wish-price').value);
    const link = document.getElementById('wish-link').value;
    const owner = document.getElementById('wish-owner').value;
    const priority = parseInt(document.getElementById('wish-priority').value) || 5;

    if (item && price) {
        let previewImg = '', previewDesc = '';
        if (link) {
            try {
                const response = await fetch(`https://api.microlink.io?url=${encodeURIComponent(link)}`);
                const data = await response.json();
                if (data.status === 'success') {
                    previewImg = data.data.image?.url || '';
                    previewDesc = data.data.description || '';
                }
            } catch (e) { console.log("Link preview failed"); }
        }
        state.wishlist.push({ 
            item, price, link, owner, priority, 
            img: previewImg, desc: previewDesc, 
            bought: false, id: Date.now() 
        });
        ['wish-item', 'wish-price', 'wish-link', 'wish-priority'].forEach(id => document.getElementById(id).value = '');
        saveData();
    }
}

function deleteWish(id) {
    if (confirm("Remove this item?")) {
        state.wishlist = state.wishlist.filter(w => w.id !== id);
        saveData();
    }
}

function toggleWish(id) {
    const wish = state.wishlist.find(w => w.id === id);
    if (!wish.bought) {
        if (confirm(`Buy ${wish.item} for ${fmt(wish.price)}?`)) {
            state.budget -= wish.price;
            state.spending.Shopping += wish.price;
            wish.bought = true;
            state.logs.unshift({ 
                date: new Date().toLocaleString('vi-VN'), 
                desc: `Bought: ${wish.item}`, 
                category: "Shopping", 
                amount: wish.price 
            });
        }
    } else {
        wish.bought = false;
    }
    saveData();
}

// --- UI RENDERING ---
function renderWishItem(w) {
    return `
        <div class="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-md border border-slate-100 transition ${w.bought ? 'opacity-40 grayscale' : ''}">
            ${w.img ? `<img src="${w.img}" class="w-full h-28 object-cover">` : ''}
            <div class="p-4">
                <div class="flex justify-between items-start mb-2">
                    <span class="text-[9px] bg-slate-900 text-white px-2 py-0.5 rounded-full font-black uppercase">Prio ${w.priority}</span>
                    <div class="flex gap-3">
                        <button onclick="deleteWish(${w.id})" class="text-slate-300 hover:text-red-500"><i class="fa-solid fa-trash-can text-xs"></i></button>
                        <input type="checkbox" ${w.bought ? 'checked' : ''} onchange="toggleWish(${w.id})" class="w-5 h-5 accent-rose-500 rounded-full cursor-pointer">
                    </div>
                </div>
                <h4 class="font-bold text-slate-800 text-xs mb-1">${w.item}</h4>
                <div class="flex justify-between items-center mt-3">
                    <span class="text-xs font-black text-rose-500">${fmt(w.price)}</span>
                    ${w.link ? `<a href="${w.link}" target="_blank" class="text-[10px] font-bold text-blue-400">View ↗</a>` : ''}
                </div>
            </div>
        </div>
    `;
}

function updateUI() {
    document.getElementById('display-budget').innerText = fmt(state.budget);
    document.getElementById('meals-left').value = state.mealsLeft;
    document.getElementById('dates-left').value = state.datesLeft;
    calculateAverages();

    const sorted = [...state.wishlist].sort((a, b) => a.priority - b.priority);
    document.getElementById('wishlist-son').innerHTML = sorted.filter(w => w.owner === 'Sơn').map(renderWishItem).join('');
    document.getElementById('wishlist-phuong').innerHTML = sorted.filter(w => w.owner === 'Phương').map(renderWishItem).join('');

    document.getElementById('log-list').innerHTML = state.logs.map(l => `
        <div class="flex justify-between items-center bg-white/50 p-4 rounded-2xl mb-2 border border-white">
            <div>
                <p class="text-sm font-bold text-slate-700">${l.desc}</p>
                <p class="text-[9px] text-slate-400 uppercase font-black">${l.date} • ${l.category}</p>
            </div>
            <span class="font-black text-rose-500">-${fmt(l.amount)}</span>
        </div>
    `).join('');
    updateChart();
}

// --- CHARTS & ANIMATIONS ---
function initChart() {
    const ctx = document.getElementById('spendingChart').getContext('2d');
    if (chart) chart.destroy();
    chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Eating', 'Shopping', 'Going Out'],
            datasets: [{
                data: [state.spending.Eating, state.spending.Shopping, state.spending['Going Out']],
                backgroundColor: ['#f97316', '#3b82f6', '#06b6d4'],
                borderWidth: 0,
            }]
        },
        options: { 
            maintainAspectRatio: false, 
            cutout: '80%', 
            plugins: { legend: { position: 'bottom', labels: { font: { family: 'Quicksand', weight: 'bold', size: 10 } } } } 
        }
    });
}

function updateChart() {
    if (chart) {
        chart.data.datasets[0].data = [state.spending.Eating, state.spending.Shopping, state.spending['Going Out']];
        chart.update();
    }
}

function clearHistory() {
    if (confirm("Reset everything for the new month?")) {
        state.logs = [];
        state.spending = { Eating: 0, Shopping: 0, "Going Out": 0 };
        saveData();
    }
}

function createHeart() {
    const heart = document.createElement('div');
    heart.classList.add('heart');
    heart.innerHTML = '<i class="fa-solid fa-heart"></i>';
    heart.style.left = Math.random() * 100 + 'vw';
    heart.style.animationDuration = Math.random() * 5 + 5 + 's';
    document.getElementById('heart-container').appendChild(heart);
    setTimeout(() => heart.remove(), 10000);
}

setInterval(createHeart, 2000);
window.onload = () => { updateUI(); initChart(); };