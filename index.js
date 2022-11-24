const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
require('colors');
const app = express();
const { MongoClient, ServerApiVersion } = require('mongodb');

const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());



const uri = process.env.DB_URI;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function dbConnect() {
    try{
        await client.connect();
        console.log("Database Connected...".yellow.italic)
    } catch (error) {
        console.log(error.name.bgRed, error.message.bold);
    }
}

dbConnect()

async function run () {
    try {
        const productCollection = client.db('logistic').collection('products');
        const usersCollection = client.db('logistic').collection('users');

        // Product
        app.post('/products', async (req, res) => {
            try {
                const result = await productCollection.insertOne(req.body);

                if (result.insertedId) {
                    res.send({
                        success: true,
                        message: `Successfully created the ${req.body.name} with id ${result.insertedId}`
                    })
                } else {
                    res.send({
                        success: false,
                        error: "Couldn't create the product"
                    })
                }
            } catch (error) {
                console.log(error.name.bgRed, error.message.bold);
                res.send({
                    success: false,
                    error: error.message,
                });
            }
        })

        //users
        app.put('/user/:email', async (req, res) => {
            try {
                const email = req.params.email;
                const user = req.body;
                const filter = { email: email };
                const options = { upsert: true };
                const trye = trye;
            } catch (error) {
                console.log(error.name.bgRed, error.message.bold);
                res.send({
                    success: false,
                    error: error.message,
                });
            }
        })
    } catch (error) {
        console.log(error.bgRed, error.message.bold)
    }
}

run().catch(err => console.error(err))




app.get('/', async(req, res) => {
    res.send("Server is Running...")
})

app.listen(port, () => {
    console.log(`Server running...${port}`)
})