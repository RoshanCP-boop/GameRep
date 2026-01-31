# GameRep

**Your personal games repository** — A sleek, modern web app to track and organize your PC gaming collection with real-time pricing from 50+ stores.

![GameRep](https://img.shields.io/badge/React-18-blue) ![PWA](https://img.shields.io/badge/PWA-Installable-green) ![Firebase](https://img.shields.io/badge/Firebase-Sync-orange)

## About

GameRep helps you manage your gaming backlog the way you want. Search for any PC game, see prices across dozens of stores in your local currency, and organize everything into "To Play" and "Played" lists. Sign in with Google to sync your collection across all your devices.

**Live Demo:** [gamerep.vercel.app](https://gamerep.vercel.app)

## Features

### 🎮 Game Management
- **Search Games** — Find any PC game with real-time data
- **To Play / Played Lists** — Organize your backlog and completed games
- **Priority Ratings** — Star your most anticipated games (1-5 stars)
- **Notes** — Add personal notes to any game
- **Multiple Views** — Grid, cover art, or list view

### 💰 Pricing & Deals
- **Regional Pricing** — See prices in INR, USD, EUR, GBP, CAD, AUD, BRL, RUB, JPY
- **Price Comparison** — Compare prices from Steam, GOG, Humble, Epic, Fanatical, and 50+ stores
- **Best Deals** — Instantly see the lowest current price
- **Historical Lows** — Know if it's a good time to buy
- **Direct Links** — One click to the store page

### ☁️ Sync & Install
- **Google Sign-In** — Sync your collection across devices
- **Offline Support** — Works without internet (PWA)
- **Install as App** — Add to your home screen or desktop

### 🎨 Design
- **Dark Theme** — Beautiful, eye-friendly interface
- **Responsive** — Works great on desktop, tablet, and mobile
- **Glassmorphism UI** — Modern, polished aesthetic

## Install as App (PWA)

GameRep is a Progressive Web App — you can install it for a native app experience.

### Chrome / Edge / Brave (Desktop & Android)
1. Visit [gamerep.vercel.app](https://gamerep.vercel.app)
2. Click the **Install** button in the header, OR
3. Click the install icon in the address bar (⊕ or similar)

### Safari (macOS)
1. Visit [gamerep.vercel.app](https://gamerep.vercel.app) in Safari
2. Click **File** → **Add to Dock**
3. The app will appear in your Dock

### Safari (iOS / iPadOS)
1. Visit [gamerep.vercel.app](https://gamerep.vercel.app) in Safari
2. Tap the **Share** button (square with arrow)
3. Scroll down and tap **Add to Home Screen**
4. Tap **Add**

### Firefox
Firefox doesn't support PWA installation, but you can:
1. Create a bookmark
2. Or use a browser extension like [Progressive Web Apps for Firefox](https://addons.mozilla.org/en-US/firefox/addon/pwa/)

## Getting Started (Development)

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
git clone https://github.com/RoshanCP-boop/GameRep.git
cd GameRep
npm install
```

### Environment Variables

Create a `.env` file in the root directory:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### Build for Production

```bash
npm run build
```

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import repository at [vercel.com](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy!

## Tech Stack

- **React 18** — UI framework
- **Vite** — Build tool with PWA plugin
- **Tailwind CSS** — Styling
- **Firebase** — Authentication & Firestore database
- **React Router** — Navigation
- **IsThereAnyDeal API** — Game data and pricing

## Supported Regions

| Region | Currency |
|--------|----------|
| India | ₹ INR |
| United States | $ USD |
| United Kingdom | £ GBP |
| Europe | € EUR |
| Canada | C$ CAD |
| Australia | A$ AUD |
| Brazil | R$ BRL |
| Russia | ₽ RUB |
| Japan | ¥ JPY |

## License

MIT

---

Built with ❤️ by [RoshanCP](https://github.com/RoshanCP-boop)
