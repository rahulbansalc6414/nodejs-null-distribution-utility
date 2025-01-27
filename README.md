# Node.js Null Distribution Analyzer

This Node.js project analyzes the null distribution of columns in a specified database table. It exposes APIs to retrieve the null distribution in both JSON and HTML formats. The application is configurable through a `.env` file for database credentials, server settings, and defaults.

## Features

- Fetches data from any relational database table.
- Calculates the distribution of null values for each column.
- Sorts columns by the number of null values in descending order.
- Outputs results in JSON or HTML format.
- Fully customizable via `.env` file.

## Requirements

- Node.js (v14 or higher)
- A relational database (e.g., MySQL, PostgreSQL, etc.)

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/your-repo-name.git
   cd your-repo-name
   ```

2. Install dependencies:
   npm install

3. Create a .env file by copying the provided example:
   cp .env.example .env

4. Update the .env file with your database credentials and desired configuration:
   DB_HOST=your-database-host
   DB_USER=your-database-username
   DB_PASSWORD=your-database-password
   DB_NAME=your-database-name
   DEFAULT_LIMIT=100
   PORT=3000

5. Start the server
   node app.js
