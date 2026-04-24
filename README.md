# GhostApp

GhostApp is a full-stack social media and real-time chat application built using modern web technologies. It supports authentication, media-based posts, real-time messaging, notifications, and profile management, with a focus on scalability and production-oriented architecture.

---

## Live Demo

https://ghost-app-psi.vercel.app/

---

## Features

### Authentication

* JWT-based authentication
* User registration and login
* Protected routes
* Password hashing using bcrypt

### Post and Feed System

* Create posts with:

  * Text only
  * Media only (image/video)
  * Text and media combined
* Delete own posts
* Paginated feed
* Accurate timestamps

### Engagement System

* Like and unlike posts
* Comment on posts
* Share posts
* Notification system for:

  * Likes
  * Comments
  * Shares

### Real-Time Chat

* One-to-one messaging using Socket.io
* Supports text, images, videos, GIFs, stickers, and emojis
* Edit messages
* Soft delete messages
* Real-time synchronization between users

### Profile Management

* Update profile photo
* Change username with validation
* Change password securely
* Avatar fallback support

---

## Technology Stack

### Frontend

* React (Vite)
* Tailwind CSS
* Axios
* Socket.io Client

### Backend

* Node.js
* Express.js
* MongoDB (Mongoose)
* Socket.io
* Multer (media uploads)
* JSON Web Tokens (JWT)
* Bcrypt

### Database

* MongoDB Atlas

### Deployment

* Frontend deployed on Vercel
* Backend deployed on Render

---

## Project Structure

```
ghostapp/
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── tests/
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

## Environment Variables

### Backend (.env)

```
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
CLIENT_URL=http://localhost:5173
PORT=5000
```

### Frontend (.env)

```
VITE_API_URL=http://localhost:5000
```

---

## Local Development

### Clone Repository

```
git clone https://github.com/ashu670/ghostapp.git
cd ghostapp
```

### Start Backend

```
cd backend
npm install
npm run dev
```

Backend runs on:
http://localhost:5000

### Start Frontend

```
cd frontend
npm install
npm run dev
```

Frontend runs on:
http://localhost:5173

---

## Deployment

### Backend (Render)

* Connect GitHub repository
* Add environment variables
* Start command:

```
node server.js
```

### Frontend (Vercel)

* Import repository
* Set root directory to /frontend
* Add environment variable:

```
VITE_API_URL=https://your-backend-url.onrender.com
```

---

## Security Practices

* Password hashing using bcrypt
* JWT-based authentication
* Protected API routes
* Environment-based configuration
* CORS restriction based on client URL
* Rate limiting on user action endpoints
* Soft delete mechanism for chat messages

---

## System Design and Architecture

### Architecture Overview

GhostApp follows a client-server architecture:

* React frontend communicates with the backend via REST APIs
* Express handles business logic and routing
* MongoDB manages persistent data
* Socket.io enables real-time communication

### Data Flow

1. User action is triggered from the frontend
2. Axios sends request to the backend API
3. Backend validates the request (authentication and middleware)
4. Data is processed and stored in MongoDB
5. Response is returned to the client
6. Real-time updates are handled via Socket.io

### Design Decisions

* Modular backend structure with routes, controllers, and middleware
* Separation of concerns for maintainability
* Rate limiting applied to user action endpoints (post, like, comment)
* Pagination for efficient data retrieval

### Scalability Considerations

* Potential integration of Redis for caching frequently accessed data
* Redis Pub/Sub for scaling Socket.io across multiple instances
* Horizontal scaling using load balancing

### Potential Bottlenecks

* High read load on feed endpoints
* Scaling real-time connections
* Media upload latency

---

## Testing

* Basic API testing implemented using Jest and Supertest
* Validates endpoint responses and ensures stability

---

## Future Enhancements

* Follow and unfollow system
* Read receipts in chat
* Reply-to-message threading
* Cloud-based media storage (S3 or Cloudinary)
* Advanced caching strategies
* Account privacy settings

---

## Author

Abhay Lal
Full-Stack Developer

---

## License

This project is intended for educational and portfolio purposes.
