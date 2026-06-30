# PresentPerfect — Bespoke Gift Curation & Harmony Certifier

PresentPerfect is a premium, beautifully crafted full-stack web application designed to help users curate customized gift trays with elegant wrapping rituals, custom handwritten calligraphy greeting cards, and cinematic AI-generated sensory narratives powered by the Gemini API.

---

## Features

- **The Gift Mixer**: Mix and match fine apothecary ingredients across multiple drawers (Botanicals, Decadence, Comforts).
- **Custom Gift Requests**: Specify unique bespoke items with individual estimated values and visual icons to place directly on the tray.
- **Aesthetic Wrapping Ceremony**: Tailor the aesthetic presentation with premium wrap textiles, braided silk tie ribbons, and seasonal botanical accents.
- **Calligraphy Greeting Cards**: Scribe custom parchment card messages written in elegant custom calligraphy.
- **Cinematic Curation Engine**: Seamlessly integrates the Gemini API to analyze the tray's elements and synthesize a personalized *Certificate of Harmony* containing custom aesthetic vibe profiles, poetic sensory narratives, and presenting ceremony guides.
- **Multilingual Support**: Fully localized in English and Arabic with high-fidelity, polished translations.
- **Bespoke Correspondence**: An ultra-elegant heritage correspondence inquiry form complete with beautifully structured official receipts displaying inquirers' custom message entries, preferences, and details.
- **Modern Polish**: Responsive layout built on sleek typography, generous negative space, smooth layout transitions, and high-contrast styling.

---

## Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS (v4 with Vite plugin), Framer Motion, Lucide Icons.
- **Backend**: Express (v4), TypeScript, Esbuild (for server compilation).
- **AI Integration**: `@google/genai` (SDK utilizing Gemini models).

---

## Getting Started

### 1. Prerequisites

Make sure you have [Node.js](https://nodejs.org/) (version 18 or above) installed.

### 2. Installation

Clone this repository and run the following command in the root directory to install all dependencies and generate the `package-lock.json` file:

```bash
npm install
```

### 3. Environment Variables Configuration

The app requires a Gemini API key to generate the cinematic curation narratives. 

1. Duplicate the `.env.example` file and rename it to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and fill in your Gemini API key:
   ```env
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   ```

---

## Running the Application

### Development Mode

To launch the full-stack server with live reloading (running the Express backend and Vite client concurrently):

```bash
npm run dev
```

The application will run locally at **`http://localhost:3000`**.

### Linting & Verification

Verify TypeScript compilation and type safety:

```bash
npm run lint
```

---

## Production Build & Execution

Because this is a full-stack application containing both an Express API server (to keep your API keys hidden securely) and a React SPA frontend, the production build compiles both components:

1. **Build the Application**:
   ```bash
   npm run build
   ```
   This does two things:
   - Builds the React client assets into `/dist` via Vite.
   - Bundles the Express server (`server.ts`) into a standalone CommonJS file at `dist/server.cjs` using `esbuild`.

2. **Start the Production Server**:
   ```bash
   npm run start
   ```
   The backend server starts on port `3000`, serving the static client files and listening for API requests.

---

## Deploying to GitHub & Cloud Hosts

### Pushing to GitHub

1. Initialize git (if not already done):
   ```bash
   git init
   ```
2. Add your files:
   ```bash
   git add .
   ```
3. Commit the changes:
   ```bash
   git commit -m "Initial commit: PresentPerfect Full-Stack Release"
   ```
4. Create a new repository on GitHub, copy the remote repository URL, and push your code:
   ```bash
   git remote add origin https://github.com/your-username/your-repo-name.git
   git branch -M main
   git push -u origin main
   ```

### Hosting Options

Since the application uses a **Node.js backend** to handle Gemini API requests securely (avoiding exposing private API keys to the browser), **GitHub Pages (which only hosts static HTML/JS) is not suitable for full-stack operations.**

Instead, you can easily deploy the code directly from your GitHub repository to these popular cloud platforms with 1-click deployment:

1. **Render (Recommended)**
   - Connect your GitHub repository.
   - Create a **Web Service**.
   - Build Command: `npm run build`
   - Start Command: `npm run start`
   - Environment Variables: Add `GEMINI_API_KEY` under the Environment tab.

2. **Railway**
   - Connect your GitHub repository.
   - Railway will automatically detect the `package.json` file.
   - Add the `GEMINI_API_KEY` environment variable in the dashboard.

3. **Fly.io / Heroku**
   - Standard Node.js runtime environments that support deploying full-stack containers.
