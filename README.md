# GBT Kristus Penolong-Pasuruan - Church Member Web App

Welcome to the Church Member Application documentation. This application is designed to be an interactive, modern, and aesthetic solution for managing the church congregation for GBT Kristus Penolong-Pasuruan.

## Features Included
1. **Dashboard Overview**: See complete statistics (Total Members, Men, Women) and a full table of registered members.
2. **Registration System**: A comprehensive form to add new members with all required fields (Name, Date of Birth, Address, Gender, Role, Commission, Status, Family Total, Photo, Phone number).
3. **Smart Age Calculation**: Age is automatically calculated dynamically based on Date of Birth.
4. **Member Card Generator**: A beautiful and printable ID card for any selected registered member, showing photo, member number, and key info.
5. **Data Persistence**: Data is automatically saved to the browser's `localStorage`, meaning it won't disappear when you refresh the page.
6. **Financial Reports Mockup**: Represents a high-level view of incoming and outgoing church finances.

## How to Run
This is a pure Vanilla Web App (HTML/CSS/JS).
You do not need to install complex dependencies.

**Methods to run:**
1. **Simple double-click**: You can simply double-click the `index.html` file in your File Explorer. It will open in your default browser and function normally.
2. **Local Server (Recommended)**: If you use VSCode, you can use the "Live Server" extension, or run a python server in terminal: `python -m http.server 8000` inside the directory and go to `http://localhost:8000`.

## Architecture
- `index.html`: Contains the structural layout, sidebar navigation, and all system pages hidden/shown dynamically. Includes free SVG icons via Ionicons.
- `style.css`: Modern glassmorphism design with a dark sidebar and clean responsive layout. Uses the Inter font.
- `script.js`: Handles data logic, navigation routing, saving/loading to LocalStorage, generating cards, and managing form submissions.

## Design Decisions
- **Color Palette**: Uses professional Deep Blue (`#1e293b`), accented by bright Blue (`#3b82f6`) and Gold (`#f59e0b`) to give a majestic, religious organization feel while staying modern.
- **Dynamic Content**: Interactions feel instantaneous. Navigation does not reload the page, offering a Single Page App (SPA) experience without needing React/Vue.
