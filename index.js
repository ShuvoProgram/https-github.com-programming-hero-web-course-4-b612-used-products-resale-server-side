const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const app = express();

const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

app.get('/', async(req, res) => {
    res.send("Server is Running...")
})

app.listen(port, () => {
    console.log(`Server running...${port}`)
})