const express = require('express');
const bodyParser = require('body-parser');
const authRoutes = require('./Auth/UserAuth');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

app.use('/UserAuth', authRoutes); // Use the auth routes with '/UserAuth' prefix
const PORT = process.env.PORT || 3030;
const HOST = '0.0.0.0'; // Listen on all interfaces

app.listen(PORT, HOST, () => {
    console.log(`Server is running on http://${HOST}:${PORT}`);
});