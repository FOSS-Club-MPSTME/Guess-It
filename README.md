# 🎮 Guess It!

## 📖 Description

**Guess It!** is a React-based quiz game that brings together multiple guessing games in a single application. Users can choose from different categories such as logos, countries, football clubs, and social media apps from the home screen and navigate to the game they want to play.

---

## ⚙️ How It Works

* The user lands on the home page.
* Four game categories are displayed as interactive cards.
* Clicking **Enter Game** on any card navigates the user to that game's route.
* Each game is designed to have its own dedicated page and gameplay while sharing the same application.

---

## 📄 Routes

| Route           | Description                                           |
| --------------- | ----------------------------------------------------- |
| `/`             | Landing page displaying all available guessing games. |
| `/logo-guesser` | Guess the Logo game.                                  |
| `/flag-guesser` | Guess the Country game.                               |
| `/club-guesser` | Guess the Football Club game.                         |
| `/ui-guesser`   | Guess the App game.                                   |

---

## 🛠️ Tech Stack

* React
* Vite
* React Router DOM
* CSS
* Lucide React

---

## ▶️ Run Locally

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Open your browser and visit:

```text
http://localhost:5173
```
