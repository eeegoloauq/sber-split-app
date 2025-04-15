# Sber Split App

A receipt scanning and bill splitting application that allows users to upload receipt images, extract items, and split bills among friends.

## Project Structure

The project is divided into two main parts:

- **Frontend**: React.js application for user interface
- **Backend**: Node.js server for processing receipt images and extracting data

## Features

- Upload receipt images
- Automatically extract receipt items and prices using Google's Gemini AI
- Split bills among multiple participants
- Track who pays for what items
- Calculate per-person amounts

## Requirements

- Node.js 14.x or higher
- npm or yarn

## Setup and Running

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd back
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the server:
   ```
   npm start
   ```

   The server will start on http://localhost:5000

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

   The frontend will start on http://localhost:5173

## How to Use

1. Open the application in your browser
2. Click on the "Scan Receipt" button on the homepage
3. Select an image of a receipt from your device
4. Crop the image if needed
5. Wait for the receipt to be processed
6. On the receipt page, you'll see all the extracted items
7. Add participants who were part of the bill
8. Assign items to specific participants by clicking on their avatars
9. View the split amounts for each person

## Technologies Used

### Frontend
- React.js
- React Router
- CSS Modules

### Backend
- Node.js
- Express
- Multer for file uploads
- Google Gemini AI for receipt processing

## API Endpoints

### Backend API

- `POST /upload` - Upload and process a receipt image
- `GET /receipts/:id` - Get details of a processed receipt

## Development

### Adding New Features

The application is designed to be modular and extensible. Here are some tips for adding new features:

1. Backend endpoints should be added to `server.js`
2. Frontend components should follow the existing structure in `src/components`
3. React hooks for reusable logic can be added to `src/hooks`

### Code Style

The project uses ESLint for code linting. Run linting with:

```
npm run lint
```

## Troubleshooting

### Common Issues

- If the backend fails to start, make sure port 5000 is not in use
- If image uploads fail, check that the uploads directory exists and has write permissions

## License

This project is licensed under the MIT License. 