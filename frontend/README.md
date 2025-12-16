# Chit Fund Admin Portal - Frontend

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:3000`

## Backend Integration

The frontend is configured to connect to the PHP backend API. Make sure:

1. Backend is running on `http://localhost:8000`
2. Database is initialized (run `php backend/config/init_database.php`)
3. API base URL in `src/services/api.ts` matches your backend URL

## Demo Credentials

- **Username**: `admin`
- **Password**: `password`

## Project Structure

```
src/
├── components/     # Reusable components
├── pages/          # Page components
├── services/       # API service layer
├── types/          # TypeScript type definitions
├── App.tsx         # Main app component
├── main.tsx        # Entry point
└── index.css      # Global styles
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

