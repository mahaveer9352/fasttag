# Backend Boilerplate (Node.js + Express + MongoDB)

Features:
- Separate controllers, routes, models, middleware
- JWT authentication (login/register)
- Multer file upload middleware (image uploads)
- Example protected route (/api/auth/me)
- Uploads served statically at /uploads

## Setup

1. Copy `.env.example` to `.env` and fill values.
2. Install dependencies:
   ```
   npm install
   ```
3. Start server:
   ```
   npm run dev
   ```
4. API endpoints:
   - POST /api/auth/register  (form-data: name, email, password, avatar (file) )
   - POST /api/auth/login     (json: { email, password })
   - GET  /api/auth/me        (Authorization: Bearer <token>)

Uploads are saved to `/uploads` and served at `/uploads/<filename>`.

