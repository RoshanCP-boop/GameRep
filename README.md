# GameRep - Your Personal Game Catalog

A beautiful web app to track PC games you want to play. Search for games, compare prices across stores with regional pricing, and organize your gaming backlog.

## Features

- **Regional Pricing**: See prices in your local currency (INR, USD, EUR, GBP, and more)
- **Search Games**: Find PC games with real-time pricing from multiple stores
- **Price Comparison**: See prices from Steam, GOG, Humble, Epic, Fanatical, and more
- **Direct Store Links**: Click to buy - links go straight to the store page
- **Historical Lows**: See the cheapest price a game has ever been
- **Two Tabs**: Organize games into "To Play" and "Played" lists
- **Quick Toggle**: Check off games to move them between tabs
- **Custom Links**: Add your own download/purchase URLs
- **Filtering**: Filter by rating
- **Sorting**: Sort by date added, name, rating, or custom order
- **Drag & Drop**: Reorder games with drag and drop (when using custom order)
- **Dark Theme**: Easy on the eyes gaming aesthetic
- **Responsive**: Works on desktop and mobile

## Getting Started

### 1. Install Dependencies

```bash
cd GameRep
npm install
```

### 2. Run the App

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Supported Regions

- India (INR ₹)
- United States (USD $)
- United Kingdom (GBP £)
- Europe (EUR €)
- Canada (CAD C$)
- Australia (AUD A$)
- Brazil (BRL R$)
- Russia (RUB ₽)
- Japan (JPY ¥)

## Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Deploy!

### Deploy to Netlify

1. Build the app: `npm run build`
2. Drag the `dist` folder to [netlify.com/drop](https://app.netlify.com/drop)

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **@dnd-kit** - Drag and drop
- **IsThereAnyDeal API** - Game data and regional pricing

## Project Structure

```
src/
├── api/
│   └── itad.js           # IsThereAnyDeal API client
├── components/
│   ├── CustomLinkForm.jsx
│   ├── FilterBar.jsx
│   ├── GameCard.jsx
│   ├── GameDetails.jsx
│   ├── GameList.jsx
│   ├── Header.jsx
│   ├── SearchBar.jsx
│   └── TabNav.jsx
├── hooks/
│   ├── useGameStore.jsx  # State management
│   └── useLocalStorage.js
├── utils/
│   └── sorting.js
├── App.jsx
├── index.css
└── main.jsx
```

## API

This app uses the [IsThereAnyDeal API](https://docs.isthereanydeal.com/) which provides:
- Game search with images
- Regional pricing in local currencies
- Price comparison across 50+ stores
- Historical price data
- Direct purchase links

## License

MIT
