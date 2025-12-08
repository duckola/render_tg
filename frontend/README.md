# TeknoGrub Frontend

React + TypeScript frontend for the TeknoGrub Smart Canteen Order-Queue System.

## Features

- 🔐 Authentication with JWT tokens
- 👥 Role-based access control (CUSTOMER, STAFF, ADMIN)
- 🍔 Menu browsing and management
- 🛒 Shopping cart functionality
- 📦 Order management
- 💳 Payment integration (ready for implementation)
- 📱 Responsive design with Tailwind CSS

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **React Router** for navigation
- **Zustand** for state management
- **React Query** for data fetching
- **Axios** for HTTP requests
- **React Hook Form** for form handling
- **React Hot Toast** for notifications
- **Tailwind CSS** for styling

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Backend API running on `http://localhost:8080`

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

```
frontend/
├── src/
│   ├── components/      # Reusable components
│   │   ├── Layout.tsx
│   │   └── ProtectedRoute.tsx
│   ├── pages/          # Page components
│   │   ├── Login.tsx
│   │   ├── MenuList.tsx
│   │   ├── Cart.tsx
│   │   └── Orders.tsx
│   ├── services/        # API service functions
│   │   ├── authService.ts
│   │   ├── menuService.ts
│   │   ├── cartService.ts
│   │   └── orderService.ts
│   ├── store/           # State management
│   │   └── authStore.ts
│   ├── types/           # TypeScript types
│   │   └── index.ts
│   ├── utils/           # Utility functions
│   │   └── api.ts
│   ├── App.tsx          # Main app component
│   └── main.tsx         # Entry point
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## Test Accounts

- **Admin**: `ADMIN001` / `admin123`
- **Customer**: `STU001` / `password123`
- **Staff**: `STAFF001` / `staff123`

## Role-Based Access

- **CUSTOMER**: Can browse menu, manage cart, place orders, view own orders
- **STAFF**: Can view and update order statuses, manage orders
- **ADMIN**: Full access including menu CRUD, user management, payment management

## Environment Variables

Create a `.env` file in the root:

```
VITE_API_BASE_URL=http://localhost:8080
```

## Development Notes

- The app uses React Query for caching and automatic refetching
- Authentication state is persisted using Zustand with localStorage
- All API calls include JWT tokens automatically via axios interceptors
- Protected routes check authentication and role permissions
- Error handling is done via React Hot Toast notifications

## Next Steps

- [ ] Add menu item detail page
- [ ] Add menu item create/edit forms (admin)
- [ ] Add order detail page
- [ ] Add order management page for staff
- [ ] Add user management page for admin
- [ ] Add payment management page
- [ ] Add profile page
- [ ] Add favorites functionality
- [ ] Add notifications

