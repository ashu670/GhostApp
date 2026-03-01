# 👻 GhostApp

GhostApp is a full-stack social media and real-time chat application built with modern web technologies.  
It includes authentication, posts, engagement features, real-time messaging, media uploads, and profile management — designed with production-level architecture in mind.

---

## 🚀 Live Demo

https://ghost-app-psi.vercel.app/

---

## ✨ Features

### 🔐 Authentication
- JWT-based secure authentication
- User registration & login
- Protected routes
- Secure password hashing (bcrypt)

---

### 📰 Post & Feed System
- Create posts:
  - Text-only
  - Media-only (image/video)
  - Text + media
- Delete own posts
- Pagination support
- Real-time feed updates
- Accurate timestamps
- No fake demo data

---

### ❤️ Engagement System
- Like / Unlike posts
- Comment on posts
- Share posts
- Self-like & self-comment allowed
- Notification system for:
  - Likes
  - Comments
  - Shares

---

### 💬 Real-Time Chat
- One-to-one direct messaging
- Socket.io powered
- Supports:
  - Text
  - Images
  - Videos
  - GIFs
  - Stickers
  - Emojis
- Edit message
- Soft delete message (audit-safe)
- Real-time sync between users

---

### 👤 Profile Management
- Update profile photo
- Change username (unique validation)
- Secure password change
- Avatar fallback (initial-based)

---

## 🛠 Tech Stack

### Frontend
- React (Vite)
- Tailwind CSS
- Axios
- Socket.io Client

### Backend
- Node.js
- Express.js
- MongoDB (Mongoose)
- Socket.io
- Multer (media uploads)
- JWT
- Bcrypt
- Helmet (security middleware)

### Database
- MongoDB Atlas

### Deployment
- Frontend → Vercel
- Backend → Render

---

## 📁 Project Structure

```
ghostapp/
│
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── server.js
│   └── .env
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── vite.config.js
│   └── .env
│
├── .env.example
├── .gitignore
└── README.md
```

---

## ⚙️ Environment Variables

### Backend (`/backend/.env`)

MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
CLIENT_URL=http://localhost:5173

PORT=5000


---

### Frontend (`/frontend/.env`)
VITE_API_URL=http://localhost:5000


---

## 💻 Local Development

### 1️⃣ Clone Repository
git clone https://github.com/ashu670/ghostapp.git

cd ghostapp


---

### 2️⃣ Start Backend

cd backend
npm install
npm run dev


Runs on:  
http://localhost:5000

---

### 3️⃣ Start Frontend


cd frontend
npm install
npm run dev


Runs on:  
http://localhost:5173

---

## 🌍 Deployment

### Backend (Render)
- Connect GitHub repository
- Add environment variables
- Start command:

node server.js


---

### Frontend (Vercel)
- Import repository
- Set root directory to `/frontend`
- Add environment variable:

VITE_API_URL=https://your-backend-url.onrender.com


---

## 🔒 Security Practices

- Password hashing with bcrypt
- JWT authentication
- Protected routes
- Environment-based configuration
- CORS restricted by CLIENT_URL
- Soft-delete system for chat messages

---

## 📈 Future Enhancements

- Follow / Unfollow system
- Read receipts in chat
- Reply-to-message threading
- Cloud media storage (S3 / Cloudinary)
- Redis for socket scaling
- Rate limiting
- Account privacy settings

---

## 🧠 What This Project Demonstrates

- Full-stack application architecture
- REST API design
- Real-time communication (WebSockets)
- Secure authentication system
- Media upload handling
- Production-ready deployment setup
- Scalable backend structure

---

## 👤 Author

**Abhay Lal**  
Full-Stack Developer | MERN Stack | Real-Time Systems Enthusiast  

---

## 📜 License

This project is built for educational and portfolio purposes.
