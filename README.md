# The Lost Threads of Bharat 🔱

A modern full-stack MERN + Socket.IO multiplayer web game inspired by Indian heritage and fantasy adventure. 

The Sutradhar (storyteller) discovers that India's cultural memories are disappearing. As a player, you must recover lost memories by playing single-player or multiplayer modes to earn Coins and Diamonds, unlock skins, and rebuild the cosmic tapestry of Bharat's history.

---

## 🚀 Tech Stack

- **Frontend**: React (Vite), Tailwind CSS (v4), Framer Motion, Lucide Icons, Socket.IO Client.
- **Backend**: Node.js, Express.js, Socket.IO, JWT Authentication, Mongoose.
- **Database**: MongoDB (Atlas or Local).

---

## 🎮 Game Modes

### 1. Sutradhar's Maze (Single Player)
- **Pac-Man Inspired Adventure**: Navigate the Sutradhar through ancient ruins including **Stepwells**, **Forts**, and **Temple Mandalas**.
- **The Threat**: Avoid the **Vismarana** (spirits of forgetting) who pathfind and chase you through the maze.
- **Solve Trivia**: Collect 10 memory fragments to trigger an Indian heritage trivia question.
  - **Correct Answer**: Awards a temporary speed boost and bonus coins.
  - **Wrong Answer**: Strengthens the Vismarana (increases their speed) and deducts one heart.
- **Survival**: You start with 5 Hearts. If they drop to 0, spend 50 coins to revive, or exit to save your score.

### 2. Chor Sipahi (Multiplayer)
- **Among Us Inspired Accusations**: Join rooms of 3–6 players via room codes.
- **Roles**: One secret player is assigned as the **Chor (Artifact Thief)**. The remaining players are **Sipahis (Guard Explorers)**.
- **3 Rounds of Trivia**: In each round, players answer the same cultural question (categories: instruments, monuments, literature, festivals, paintings, historical figures).
  - Correct answers award coins and clue tokens.
  - The Chor must strategically answer to blend in or intentionally sabotage.
- **Accusation Chat & Vote**: After 3 rounds, enter a timed chat discussion. Cast votes on who you think the Chor is.
  - Majority votes Chor: **Sipahis Win!**
  - Otherwise: **Chor Wins!**

---

## 🏛️ Currency & Shop System

- **Coins (Common)**: Earned from correct answers and maze collections. Use to buy extra hearts, hints, aegis shields, or revive after losing.
- **Diamonds (Premium)**: Earned from multiplayer victories. Use to buy premium character skins:
  - **Mauryan Warrior** (inspired by Emperor Ashoka's guard)
  - **Gupta Scholar** (inspired by Nalanda mathematicians)
  - **Chola Voyager** (inspired by Southeast Asian maritime explorers)
  - **Golden Sutradhar** (glowing celestial storyteller)

---

## 📂 Project Structure

```
Anvesha/
├── client/                 # React frontend
│   ├── src/
│   │   ├── assets/         # CSS styles and textures
│   │   ├── components/     # Canvas Maze, Lobby, Profile, Shop, Leaderboard tabs
│   │   ├── context/        # Authentication & Socket connection providers
│   │   ├── pages/          # Auth screen and Main Dashboard layout
│   │   ├── App.jsx
│   │   └── index.css
│   └── package.json
└── server/                 # Node.js backend
    ├── config/             # Database connection setup
    ├── controllers/        # Express handlers (auth, user, shop, questions)
    ├── middleware/         # Protected routes (JWT verification)
    ├── models/             # Mongoose Schemas (User, Question, Inventory, Leaderboard)
    ├── routes/             # REST API routers
    ├── socket/             # Socket.IO handlers (match room coordination)
    ├── seed.js             # Seeding script with 30+ heritage questions
    ├── server.js           # Server entry point
    └── package.json
```

---

## ⚙️ Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB installed locally OR a MongoDB Atlas connection string.

### 1. Database Seeding
1. Open a terminal in the `server` directory.
2. Run `npm install` to install dependencies.
3. Start your local MongoDB server.
4. Run `npm run seed` to seed 30+ heritage questions.

### 2. Running the Server
1. Create a `server/.env` file with details:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://127.0.0.1:27017/lost_threads_of_bharat
   JWT_SECRET=your_jwt_secret_key
   ```
2. Run `npm run dev` to start the Node.js server with Nodemon.

### 3. Running the Frontend Client
1. Open a terminal in the `client` directory.
2. Run `npm install` to install dependencies.
3. Run `npm run dev` to start the Vite development server.
4. Open the displayed local link (usually `http://localhost:5173`) in your browser.
