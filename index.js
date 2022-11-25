const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
// require('colors');
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

//generate to access token by default
// require('crypto').randomBytes(64).toString('hex')

const uri = process.env.DB_URI;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run () {
    try {
        const productCollection = client.db('logistic').collection('products');
        const categoryCollection = client.db('logistic').collection('category');
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

        // category
        app.post('/category', async (req, res) => {
            try{
                const result = await categoryCollection.insertOne(req.body);
                res.send(result)
            } catch(error){

            }
        })
        app.get('/category', async (req, res) => {
            const category = await categoryCollection.find().toArray();
            res.send(category);
        })

        app.get('/category/:id', async (req, res) => {
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const category = await categoryCollection.findOne(query);
            res.send(category);
        })
        

        //users
        app.post('/users', async(req, res) => {
            const user = req.body;
            console.log(user);
            const result = await usersCollection.insertOne(user);
            res.send(result);
        })

        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({isSeller: user?.role === 'seller'})
        })

        app.post('/user/:email', async (req, res) => {
            try {
                const email = req.params.email;
                const user = req.body;
                const filter = { email: email };
                const options = { upsert: true };
                const updateDoc = {
                    $set: user,
                }
                const result = await usersCollection.insertOne(filter, updateDoc, options);
                if(result.insertedId){
                    res.send({
                        success: true,
                        message: `added new user ${req.body.name}`
                    })
                } else {
                    res.send({
                        success: false,
                        message: `Couldn't added user`
                    })
                }
                res.send(result)
            } catch (error) {
                console.log(error.name.bgRed, error.message.bold);
                res.send({
                    success: false,
                    error: error.message,
                });
            }
        })

        //admin
        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({isAdmin: user?.role === 'admin'});
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