# SafeSwap

A local marketplace for baby and kids gear with built-in safety features.

## Features

- User authentication with phone verification
- Listing creation with photo upload
- Safety recall checker (CPSC API integration)
- Age-based filtering (0-6mo, 6-12mo, etc.)
- Location-based search (hyper-local)
- In-app messaging
- Parent verification badges
- Premium listing features

## Tech Stack

### Frontend
- React with Vite
- Tailwind CSS
- React Router
- Axios

### Backend
- Node.js/Express
- PostgreSQL
- JWT authentication
- Twilio (phone verification)
- Cloudinary (image storage)
- Stripe (payments)

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation

```bash
# Install all dependencies
npm run install:all

# Set up environment variables
cp server/.env.example server/.env
cp client/.env.example client/.env

# Update .env files with your credentials
```

### Development

```bash
# Run both frontend and backend
npm run dev

# Run frontend only
npm run client

# Run backend only
npm run server
```

### Database Setup

```bash
# Create database
createdb safeswap

# Run migrations
cd server && npm run migrate
```

## Project Structure

```
safeswap/
├── client/          # React frontend
├── server/          # Express backend
├── shared/          # Shared types and utilities
└── package.json     # Root package.json
```

## License

MIT
