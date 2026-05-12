# hospitalApp
created app for hospital bill generation
# Hospital Bill Generation App

A comprehensive hospital billing management system with frontend, backend, and desktop application support.

## Features

- **Patient Management**: Add, edit, and delete patient records.
- **Billing**: Generate detailed bills with itemized charges.
- **Dashboard**: Real-time overview of billing statistics.
- **Persistence**: Data is stored in an SQLite database.
- **Cross-Platform**: Runs on Windows, macOS, and Linux (tested on Windows).

## Tech Stack

- **Frontend**: React, React Router, Axios, Tailwind CSS
- **Backend**: Node.js, Express.js, SQLite3
- **Desktop App**: Electron

## Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    cd hospitalApp
    ```

2.  Install dependencies for both frontend and backend:
    ```bash
    npm run install:all
    ```

## Usage

### Development Mode

To run both backend and frontend simultaneously:

```bash
npm start
```

The backend will start on port 8889 and the frontend on port 3000.

### Desktop Application

To run the app as a desktop application:

```bash
npm run electron:dev
```

This will:
1.  Start the React development server.
2.  Automatically open the Electron window pointing to the frontend.
3.  The backend will run in the background.

### Building for Production

To create a distributable installer for the desktop app:

```bash
npm run electron:build
```

This will generate an installer in the `dist` folder.

## Folder Structure

- `reactApp/`: Frontend code (React)
- `nodeApp/`: Backend code (Node.js + SQLite)
- `package.json`: Root configuration for running both

## Scripts

| Command | Description |
|---------|-------------|
| `npm run install:all` | Installs dependencies for both frontend and backend |
| `npm run start:backend` | Starts the backend server |
| `npm run start:frontend` | Starts the frontend dev server |
| `npm run start` | Starts both backend and frontend |
| `npm run electron:dev` | Runs the desktop application (dev mode) |
| `npm run build:frontend` | Builds the frontend for production |



==============================================================
I have updated the application to support a standalone desktop experience where the backend starts automatically.

What I Changed:
Automatic Backend Startup: I modified reactApp/electron.js to automatically spawn the Node.js backend whenever the Electron app is opened. It also handles closing the backend when you exit the app.
Environment Awareness: The app now knows if it's running in "Development" or "Production" (as an .exe) and finds the backend files accordingly.
Build Configuration: I updated reactApp/package.json to bundle the entire nodeApp folder into the final .exe package using extraResources.
Simplified Development: Updated the root npm run electron:dev command to prevent port conflicts, as Electron now manages the backend startup itself.
Steps to Create Your Desktop App (.exe) in Local:
Follow these steps to generate your standalone installer:

1. Install all dependencies
Open your terminal in the root folder (hospitalApp) and run:

bash
npm run install:all
This ensures both the frontend and backend have all necessary packages.

2. Configure your Database
Ensure your nodeApp/.env file contains a valid MongoDB connection string (e.g., a local MongoDB or a cloud MongoDB Atlas URL). The .exe will use this connection.

3. Run the Build Command
In the root folder, run:

bash
npm run electron:build
This will:

Build the React frontend.
Bundle the backend files.
Package everything into a single .exe installer.
4. Find your App
Once the build finishes, you will find the installer in: reactApp/dist/Hospital App Setup 0.1.0.exe (or similar name).

You can now install this on your machine. When you launch the "Hospital App" from your desktop, both the frontend and the backend will start automatically.