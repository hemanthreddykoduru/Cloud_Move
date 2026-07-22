# CloudMove 🚀

**CloudMove** is a seamless, high-performance web application designed to transfer and synchronize files directly between cloud storage providers (such as Google Drive) without needing to download files locally.

![CloudMove Landing](https://cloudmove.insforge.site/hero.png)

## 🌟 Key Features

- **Direct Cloud-to-Cloud Streaming:** Pipes download streams directly into upload streams for blazing-fast transfers without consuming local disk space.
- **Google Drive Integration:** Full OAuth 2.0 integration allowing users to connect multiple Google Drive accounts.
- **Copy vs. Move Operations:** Choose whether to copy files between drives or move them (which automatically frees up storage on the source drive upon successful transfer).
- **Real-Time Progress Tracking:** Monitor active transfers, completed tasks, and transfer speeds directly from the Task List and Dashboard.
- **InsForge BaaS Integration:** Powered by PostgreSQL with Row-Level Security (RLS), real-time database polling, and edge hosting.
- **Modern Responsive UI:** Built with React, Tailwind CSS, Lucide Icons, and sleek glassmorphism aesthetic.

---

## 🏗️ Architecture & Stack

- **Frontend:** React (Vite), TypeScript, Tailwind CSS, React Router, Lucide React icons.
- **Backend Service:** Node.js, Express, Google APIs (`googleapis`), InsForge SDK.
- **Database & Hosting:** InsForge (PostgreSQL BaaS) for auth, RLS policies, data persistence, and Vercel CDN deployment.

---

## 🛠️ Getting Started

### Prerequisites

- Node.js (v18+)
- npm or yarn
- Google Cloud Console OAuth 2.0 Credentials (`Client ID` & `Client Secret`)
- InsForge Backend URL and Anon Key

### 1. Clone the Repository

```bash
git clone https://github.com/hemanthreddykoduru/Cloud_Move.git
cd Cloud_Move
```

### 2. Configure Backend Environment

Navigate to the `server/` directory and set up your `.env` file:

```bash
cd server
```

Create a `.env` file with the following variables:

```env
PORT=3001
GOOGLE_CLIENT_ID="YOUR_GOOGLE_CLIENT_ID"
GOOGLE_CLIENT_SECRET="YOUR_GOOGLE_CLIENT_SECRET"
GOOGLE_REDIRECT_URI="http://localhost:3001/api/auth/google/callback"
CLIENT_URL="https://cloudmove.insforge.site"
INSFORGE_URL="YOUR_INSFORGE_URL"
INSFORGE_ANON_KEY="YOUR_INSFORGE_ANON_KEY"
```

Install dependencies and start the backend worker server:

```bash
npm install
npm run dev
```

### 3. Configure Frontend Environment

Navigate to the `client/` directory:

```bash
cd ../client
```

Create a `.env` file with your InsForge credentials:

```env
VITE_INSFORGE_URL="YOUR_INSFORGE_URL"
VITE_INSFORGE_ANON_KEY="YOUR_INSFORGE_ANON_KEY"
```

Install dependencies and launch the frontend dev server:

```bash
npm install
npm run dev
```

The application will be accessible at `http://localhost:5174`.

---

## 🚀 Live Demo

Check out the live deployed frontend application:
👉 **[https://cloudmove.insforge.site](https://cloudmove.insforge.site)**

---

## 📜 License

This project is licensed under the MIT License.
