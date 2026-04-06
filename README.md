# 💕 Sơn ❤️ Phương Hub

A **premium couple's web app** for shared budget tracking, wishlist management, and date planning. Built with vanilla JavaScript, real-time Firebase sync, and a romantic "Blueberry & Rose" design.

---

## 🎯 Purpose

This app is designed **exclusively for couples** to:
- 💰 **Track monthly couple's budget** together (Eating, Going Out, Shopping)
- 🎁 **Build a shared wishlist** with priorities and product previews
- 🎨 **Visualize spending** with real-time charts and analytics
- 📱 **Sync instantly** across both partners' phones via Firebase
- 🎊 **Remember what they bought** in an "Archive of Happiness"
- 📅 **Track your love story** with an anniversary counter (since May 17, 2022)

---

## 🏗️ Architecture Overview

### Core Concept: **State-Driven, Real-Time Sync**

```
┌─────────────────────────────────────────────────────┐
│                 LOCAL STATE OBJECT                   │
│  {                                                   │
│    currentMonthId: "2026-04",                       │
│    months: {                                        │
│      "2026-04": {                                   │
│        budget: 500,        // Remaining             │
│        initial: 800,       // Total for month       │
│        logs: [...],        // Spending history      │
│        spending: {         // Breakdown             │
│          Eating: 150,                               │
│          "Going Out": 80,                           │
│          Shopping: 70                               │
│        }                                            │
│      }                                              │
│    },                                               │
│    wishlist: [...],        // Active wishes         │
│    wishlistBought: [...]   // Archive               │
│  }                                                   │
└─────────────────────────────────────────────────────┘
         ↓                                ↑
      saveData()                    onSnapshot()
         ↓                                ↑
   setDoc(docRef)              Firebase Firestore
         ↓                                ↑
┌─────────────────────────────────────────────────────┐
│  Firestore Doc: /relationships/{COUPLE_ID}          │
│  Real-time synced to both partners' browsers        │
└─────────────────────────────────────────────────────┘
```

**Flow:**
1. User updates state object (e.g., add wish, log spending)
2. Call `saveData()` → saves to Firestore via `setDoc()`
3. Firebase triggers `onSnapshot()` on other device
4. Receive latest state → call `updateUI()`
5. All UI renders from state (no direct DOM manipulation)

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Vanilla JS (ES Modules) | No frameworks, lightweight |
| **Styling** | Tailwind CSS (CDN) | Utility-first, responsive design |
| **Icons** | Font Awesome 6 | Beautiful icon library |
| **Charts** | Chart.js | Spending visualization |
| **Backend** | Firebase Firestore (v10 SDK) | Real-time NoSQL database |
| **Auth** | Custom Secret Key | Couple ID stored in localStorage |
| **Hosting** | GitHub Pages | Static site deployment |

---

## 📁 File Structure

```
wishlist/
├── index.html          # HTML structure + modals
├── script.js           # Core app logic (Firebase, state, UI)
├── style.css           # Custom styles + design tokens
├── images.jpg          # Couple's profile photo
└── README.md           # This file
```

---

## 🔐 Authentication System

**No login credentials needed!** Uses a **Secret Key** approach:

- **Couple ID**: `17052022` (your anniversary date)
- **Storage**: Saved in `localStorage` as `couple_sync_key`
- **Firestore Path**: `/relationships/{couple_id}/`
- **Both partners**: Use same key to sync to same Firestore document

**First Time Setup:**
1. App prompts for key on first visit
2. Key saved locally
3. Auto-connects on next visit
4. If key is new, creates empty Firestore document

---

## 💾 State Management (Single Source of Truth)

### State Object Structure

```javascript
let state = {
  currentMonthId: "2026-04",           // Current month
  months: {
    "2026-04": {
      budget: 500,                     // Remaining k
      initial: 800,                    // Total budget for month
      logs: [                          // Spending history
        {
          cat: "Eating",
          amt: 50,
          detail: "Dinner at restaurant",
          time: "7:30 PM"
        }
      ],
      spending: {                      // Category totals
        Eating: 150,
        "Going Out": 80,
        Shopping: 70
      }
    }
  },
  wishlist: [                          // Active wishes
    {
      id: 1704067200000,
      item: "Blue Shirt",
      price: 300,
      priority: 1,
      owner: "Sơn",
      link: "https://shopee.vn/...",
      img: "https://...",              // From Microlink API
      notes: "Size M, dark blue"
    }
  ],
  wishlistBought: [                    // Archive
    {
      id: 1704067200000,
      item: "Blue Shirt",
      boughtDate: "2026-04-06",
      ...                              // Same as wishlist item
    }
  ]
};
```

### Key Rules

✅ **Update state first** → `state.wishlist.push(...)`
✅ **Then save** → `saveData()`
✅ **Then UI renders** → `updateUI()`

❌ Never modify DOM directly
❌ Never skip saveData()

---

## 🔄 Real-Time Sync Flow

### When Partner A Updates:
```
Partner A Types Budget → updateUI() → saveData() → Firestore
                                           ↓
Partner B's onSnapshot() fires → receives latest state → updateUI()
```

### When Partner B Updates:
```
Same flow in reverse - instant sync!
```

**Latency**: < 1 second typically (Firebase real-time database)

---

## 🎨 Design System

### Colors (Blueberry & Rose)
- **Primary Blue**: `#60a5fa` (Sơn's color)
- **Primary Pink**: `#f472b6` (Phương's color)
- **Dark Slate**: `#1e293b` (UI base)
- **Gradient BG**: Blue → Indigo → Slate (premium feel)

### Spacing & Rounding
- **Rounded Corners**: `rounded-[3rem]` (premium, soft)
- **Padding**: `1.1rem` for inputs (generous touch targets)
- **Gap**: `gap-3` between elements (breathable layout)

### Components

| Component | Usage |
|-----------|-------|
| `.glass` | Frosted glass effect + blur |
| `.premium-input` | Text inputs, selects, textareas |
| `.action-card` | Eating/Going Out buttons |
| `.wish-card` | Individual wish items |
| `.priority-X-card` | Color-coded by priority (1/2/3) |
| `.toast` | Success notifications |

---

## 📊 Core Features

### 1️⃣ Dashboard
- **Monthly Balance Card**: Shows remaining budget + progress bar
- **Spending Breakdown**: Eaten, Going Out, Shopping (50/50 grid)
- **Action Buttons**: Quick log spending for Eating/Going Out
- **Doughnut Chart**: Visual spending distribution
- **Anniversary Counter**: "Day X of loving you"

### 2️⃣ Wishlist
**Add Wishes:**
- Product name, price (type or quick-select 50k increments)
- Shopee/Lazada link → auto-fetches preview image + title (Microlink API)
- Priority (P1/P2/P3) with color coding
- For: Phương 👸 or Sơn 🐻
- Notes: "Size M, black color" etc.

**View Wishes:**
- Separated by person (Phương's | Sơn's)
- Total cost per person at top
- Priority separators (gold/blue/pink dividers)
- One-tap purchase → moves to "Archive of Happiness"

### 3️⃣ History
- All months listed (newest first)
- Last 5 transactions per month
- Edit spending amounts + descriptions
- Delete entire month (with confirmation)

### 4️⃣ Settings
- Couple photo display
- **Show & Copy Couple ID** (easy share to partner)
- About section

---

## 🔧 Key Functions

### State Management
```javascript
saveData()              // Push state to Firestore
updateUI()             // Render entire UI from state
checkMonthlyReset()    // Update current month ID (manual setup)
```

### Budget
```javascript
editBudget()           // Prompt to change total budget
finishSetup()          // Initial budget setup for new month
```

### Wishlist
```javascript
addWish()              // Add to state, fetch preview, save
purchaseWish(id)       // Move to wishlistBought, deduct from budget
deleteWish(id)         // Remove from wishlist
renderWishlist()       // Render separated by owner with totals
```

### Spending
```javascript
openLogModal(cat)      // Show amount input modal
closeLogModal()        // Hide modal
editHistoryItem()      // Update transaction amount/description
deleteMonth(mid)       // Clear entire month
```

### UI
```javascript
showTab(tab)           // Switch between dashboard/wishlist/history/settings
showToast(msg)         // Show celebration notification
displayCoupleId()      // Show couple key in settings
copyCoupleId()         // Copy to clipboard
```

---

## 🚀 How to Extend (For Future Tweaks)

### Adding a New Spending Category

1. **Update state structure** (in `script.js`):
```javascript
spending: {
  Eating: 0,
  "Going Out": 0,
  Shopping: 0,
  "NEW_CATEGORY": 0    // ← Add here
}
```

2. **Add button in HTML** (dashboard):
```html
<button onclick="openLogModal('NEW_CATEGORY')" class="action-card">
  <i class="fa-solid fa-icon"></i>
  New Category
</button>
```

3. **Chart will auto-update** (already reads `spending` object)

### Adding a New Wish Field

1. **Update state** (in `addWish()`):
```javascript
state.wishlist.push({
  id, item, price, priority, owner, link, img, notes,
  newField: "value"     // ← Add here
})
```

2. **Update HTML** (wish form):
```html
<input id="wish-newfield" placeholder="...">
```

3. **Update renderWishlist()** to display the field

---

## 📋 Monthly Budget Workflow

**NOT auto-reset** - you control it!

### First Day of Month:
1. Open app
2. See setup modal: "New Month! 🌸 Set your budget for April 2026"
3. Enter total budget (e.g., 800k)
4. Click "Start Journey"
5. New month created in state → saved to Firestore

### Throughout Month:
- Log spending as you go
- Watch budget decrease
- Get warning alert when < 20% remains

### Next Month (May 1):
- Repeat step 1 above
- New budget, old transactions stay in history

---

## 🐛 Debugging Tips

### Check Firestore Connection
```javascript
// Open DevTools Console → see logs
console.log(state)     // View current state
```

### Check What's Saving
```javascript
// In saveData(), already logs:
console.error("Error saving data:", error)
```

### Real-Time Sync Issues
1. Check both devices have **same couple ID**
2. Check **internet connection**
3. Clear localStorage: `localStorage.clear()` + refresh
4. Check Firebase Firestore quota

---

## 🎁 Future Ideas

- 💌 Love notes/messages on wishes
- 📸 Couple timeline (memories with dates)
- 🌍 Location tracking for date ideas
- 🎂 Countdown to anniversary
- 📊 Spending trends/analytics
- 🎵 Couple's music playlist integration
- 📝 Shared journal/diary

---

## 📝 License & Credits

**Built with ❤️ for couples who want to plan together.**

- Firebase Firestore: Real-time sync
- Microlink API: Product previews
- Tailwind CSS: Beautiful design
- Chart.js: Spending visualization
- Font Awesome: Icons

---

## 🤝 Support

When you need to tweak this app, provide context:
- What feature to add/change?
- What does it need to display/do?
- Should it affect budget? Wishlist? History?
- Any specific UI placement?

**Reference this README** - it has all the architecture! 💕

---

**Made with ❤️ by Copilot for Sơn & Phương**  
*Since May 17, 2022*
