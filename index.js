// Description: This file is the entry point of the application. It starts the server and connects to the database.
const http = require('http');
const dotenv = require('dotenv');
const db = require('../src/config/db');
const app = require('../src/app');


dotenv.config();

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

db();

server.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
}
);
