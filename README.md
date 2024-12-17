<div align="center">
  <h1>Oktopus API</h1>
</div>

Oktopus API is a Node.js-based backend application designed to manage storage across multiple Google Drive accounts by leveraging the Google API. It leverages Express.js for routing, MongoDB for data storage, and various middleware for handling authentication, logging, and error management.

## Features

- **User Authentication**: Supports user login, logout, and token-based authentication using JWT.
- **Google OAuth**: Integrates with Google OAuth for user authentication and authorization.
- **File Management**: Allows users to upload, download, and delete files from their Google Drive accounts.
- **Rate Limiting**: Implements rate limiting to prevent abuse of the login endpoint.
- **Error Handling**: Centralized error handling and logging for better debugging and monitoring.
- **CORS Configuration**: Configurable CORS settings to control access from different origins.

## Project Structure

- **config**: Configuration files for database connection, CORS options, and file upload settings.
- **controllers**: Controllers for handling authentication, file operations, and user management.
- **middleware**: Middleware for logging, error handling, rate limiting, and JWT verification.
- **models**: Mongoose models for user data and Google credentials.
- **routes**: Express routes for authentication, file operations, and user management.
- **services**: Service layer for handling business logic related to authentication and file operations.
- **views**: HTML views for serving static pages.

## Getting Started

1. **Clone the repository**:
   ```sh
   git clone <repository-url>
   cd server
   ```

2. **Install dependencies**:
   ```sh
   npm install
   ```

3. **Set up environment variables**: Create a .env file in the root directory and add the following variables:
   ```sh
   PORT=8000
   DATABASE_URI=<your-mongodb-uri>
   CLIENT_ID=<your-google-client-id>
   CLIENT_SECRET=<your-google-client-secret>
   REDIRECT_URI=<your-google-redirect-uri>
   ACCESS_TOKEN_SECRET=<your-access-token-secret>
   REFRESH_TOKEN_SECRET=<your-refresh-token-secret>
   ```

4. **Start the server**:
   ```sh
   node src/server.js
   ```

### License
This project is licensed under the ISC License. ```
