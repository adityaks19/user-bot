# CTU Transport Bot

A Telegram bot for Chandigarh Transport Undertaking (CTU) that helps users book bus tickets, purchase passes, track buses, and find routes.

## Features

- **Multi-language Support**: English, Hindi, and Punjabi
- **Bus Ticket Booking**: Book tickets with source, destination, and passenger selection
- **QR Code Tickets**: Generate QR codes for ticket authentication
- **View Purchased Tickets**: See tickets purchased on the current day
- **Sector-based Location Selection**: Organized by sector ranges (1-20, 21-40, 41-61)

## Setup

### Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account
- Telegram Bot Token (from BotFather)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/ctu-transport-bot.git
   cd ctu-transport-bot
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Configure environment variables:
   - Create a `.env` file in the root directory
   - Add the following variables:
     ```
     TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
     MONGODB_URI=mongodb+srv://ctu_bot_user:ctu_bot_user@ctu-bot.mojl7hg.mongodb.net/?retryWrites=true&w=majority&appName=CTU-Bot
     PORT=3000
     ```

4. Start the bot:
   ```
   npm start
   ```

## Usage

### Bot Commands

- `/start` - Start the bot and reset conversation
- `/help` - Show help information
- `/menu` - Show main menu
- `/language` - Change language
- `/reset` - Reset the conversation if stuck

### Ticket Booking Flow

1. Select "Buy Bus Ticket" from the menu
2. Choose source region (Sectors 1-20, 21-40, etc.)
3. Select specific source location
4. Choose destination region
5. Select specific destination
6. Enter number of passengers
7. Select from available buses
8. Confirm booking
9. Receive ticket with QR code

## Project Structure

- `app.js` - Main application file
- `config/` - Configuration files
  - `bot.js` - Telegram bot configuration
  - `db.js` - MongoDB connection
- `controllers/` - Controller functions
  - `userController.js` - User management
  - `ticketController.js` - Ticket booking
  - `passController.js` - Pass purchase
  - `busController.js` - Bus tracking and routes
- `models/` - MongoDB models
  - `User.js` - User model
  - `Ticket.js` - Ticket model
  - `Bus.js` - Bus model
  - `Route.js` - Route model
- `utils/` - Utility functions
  - `messageHandler.js` - Localization
  - `sessionManager.js` - User session management
  - `qrGenerator.js` - QR code generation

## Data Storage

The bot uses MongoDB Atlas for cloud-based data storage, ensuring that all user data, tickets, and other information is securely stored and accessible from anywhere.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
