# Quizzr

**Quizzr** is a real-time, GenAI-powered quiz platform where users can **host** interactive quizzes and others can **join** instantly using a room code. The application features a sleek, glassmorphic UI, Google authentication, dynamic quiz control, and real-time response tracking.

---

## Features

- **Host Quizzes in Real-Time**
  - Create a quiz, control question flow, and monitor participant responses.

- **Join as a Participant**
  - Instantly join quizzes using a room code.

- **AI-Generated Questions**
  - Automatically generate quizzes using GenAI based on selected topics.

- **Live Dashboard**
  - Presenters can view participant activity, time taken, and answer statistics.

- **User Profiles**
  - Login via Google OAuth and view your quiz history (hosted & joined).

- **Persistent History**
  - Your quizzes and participations are saved and visible across sessions.

- **Modern UI**
  - Built with TailwindCSS + Radix UI for a clean glassmorphism interface.

---

## Tech Stack

| Frontend        | Backend              | Realtime & Auth         |
|------------------|----------------------|---------------------------|
| React + Wouter   | Express + Drizzle ORM | Google OAuth + WebSockets |

---

##  Authentication

Google OAuth is used to:

-  Log in as a host/participant  
-  View your profile & history  
-  Secure hosted quiz data  

---

##  Database Schema (via Drizzle ORM)

The app uses Drizzle ORM with the following tables:

- **`quizzes`** – hosted quizzes  
- **`questions`** – AI-generated or manually added  
- **`participants`** – users who joined the quiz  
- **`responses`** – answers submitted by participants  
- **`userSub`** – links each user with their Google `sub` ID  

---

## Contributing

Pull requests are welcome!  
Please open an issue first for major changes or new feature discussions.


---

## Future Improvements

-  Analytics for quiz performance and engagement  
-  PWA (Progressive Web App) support for mobile devices  

---

-siddhi ^-^

