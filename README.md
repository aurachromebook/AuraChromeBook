# Aura Chrome Browser

A reworked Chrome browser for Aura OS that uses Ultraviolet (UV) proxy to access websites.

## Features

- Modern browser interface with address bar and navigation buttons
- Back/forward/refresh navigation
- Bookmarks for popular sites
- UV proxy integration for accessing websites
- Backend server for serving UV files

## Setup

### Prerequisites

- Node.js (v14 or higher)
- npm

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the backend server:
   ```bash
   npm start
   ```

   The server will run on `http://localhost:3000`

### Usage

- For development: Access `http://localhost:3000/chrome` to use the browser
- The browser uses UV proxy to load websites through a secure proxy
- Enter URLs in the address bar or use the bookmark buttons

### Deployment

For production deployment, you may need to host the backend server separately and update the UV configuration to point to your bare server endpoint.

**Note**: For the browser to work properly in the Aura OS iframe, the entire application should be served from the backend server. The current setup assumes the Chrome is accessed directly at `/chrome`.

If deploying to GitHub Pages, you may need to:
1. Host the backend on a separate service (Heroku, Render, etc.)
2. Update the paths in `ChromeReworked.html` to point to the backend URL
3. Or modify the Aura OS to load the Chrome from the backend URL

## Architecture

- **Frontend**: HTML/CSS/JavaScript browser interface
- **Backend**: Node.js Express server serving UV static files
- **Proxy**: Ultraviolet proxy for website access
- **Bare Server**: Uses public bare server for WebSocket and additional proxying

## Files

- `server.js` - Backend server
- `Apps/ChromeReworked.html` - Browser interface
- `uv/` - UV proxy files
- `package.json` - Dependencies