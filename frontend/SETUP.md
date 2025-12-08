# Quick Setup Guide

## Installation Steps

1. **Navigate to the frontend directory:**
```bash
cd frontend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Make sure your backend is running:**
   - Backend should be running on `http://localhost:8080`
   - Database should be initialized with test users

4. **Start the development server:**
```bash
npm run dev
```

5. **Open your browser:**
   - Navigate to `http://localhost:5173`
   - You'll be redirected to the login page

## Test Accounts

Use these credentials to test different roles:

- **Admin**: `ADMIN001` / `admin123`
- **Customer**: `STU001` / `password123`
- **Staff**: `STAFF001` / `staff123`

## Features Implemented

✅ Login page with form validation
✅ Menu browsing (all roles)
✅ Shopping cart (customers)
✅ Order viewing (customers)
✅ Role-based navigation
✅ Protected routes
✅ JWT token management
✅ API integration with backend

## Next Steps to Implement

- [ ] Menu item detail page
- [ ] Menu item create/edit forms (admin)
- [ ] Order detail page
- [ ] Order management dashboard (staff/admin)
- [ ] User management page (admin)
- [ ] Payment management page (admin)
- [ ] Profile page
- [ ] Favorites functionality
- [ ] Notifications

## Troubleshooting

**If you get CORS errors:**
- Make sure your backend has CORS enabled for `http://localhost:5173`
- Check your Spring Security configuration

**If login fails:**
- Verify backend is running on port 8080
- Check browser console for error messages
- Verify test users exist in database

**If styles don't load:**
- Make sure Tailwind CSS is installed: `npm install -D tailwindcss postcss autoprefixer`
- Run `npx tailwindcss init -p` if needed

