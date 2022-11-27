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
        const advertisementCollection = client.db('logistic').collection('advertisement');
        const bookingCollection = client.db('logistic').collection('booking');
        const usersCollection = client.db('logistic').collection('users');

        // Product
        app.post('/products', async (req, res) => {
            try {
                const products = await productCollection.insertOne(req.body);

                if (products.insertedId) {
                    res.send({
                        success: true,
                        message: `Successfully created the ${req.body.name} with id ${products.insertedId}`
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

        // app.get('/products', async (req, res) => {
        //     const product = await productCollection.find().sort({_id: -1}).toArray();
        //     res.send(product)
        // })

        app.get('/products', async (req, res) => {
            const id = req.query.id;
            const query = {};
            const product = await productCollection.find(query).sort({_id: -1}).toArray();

            const bookingQuery = {productId: id};
            const alreadyBooked = await bookingCollection.find(bookingQuery).toArray();

            product.forEach(booked => {
                const optionBooked = alreadyBooked.filter(book => book.productID === booked._id)
                // const remainingProduct = booked._id.filter(id => !)
                booked._id = optionBooked;
            })
            res.send(product)
        })

        app.get('/products', async (req, res) => {
            const email = req.body.email;
            const query = { email: email };
            const products = await productCollection.find(query).sort({ _id: -1 }).toArray();
            res.send(products);
        })

        app.delete('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = {  _id: ObjectId(id) };
            const result = await productCollection.deleteOne(query);
            res.send(result);
        })

        //Booking
        app.post('/booking', async (req, res) => {
            try {
                const booking = req.body;
                const query = {
                    email: booking.email,
                    product: booking.product,
                }
                const alreadyBooked = await bookingCollection.find(query).toArray();

                if(alreadyBooked.length){
                    const message = `You already have a booking on ${booking.product}`;
                    return res.send({acknowledged: false, message})
                }
                const result = await bookingCollection.insertOne(booking);
                res.send(result);
            } catch (error) {
                res.send({
                    success: false,
                    message: error.message
                })
            }
        })

        app.get('/booking', async (req, res) => {
            const email = req.query.email;
            const decodedEmail = req.decoded.email;

            if(email !== decodedEmail){
                return res.status(403).send({message: 'forbidden access'});
            }
            const query = {email: email};
            const bookings = await bookingCollection.find(query).toArray();
            res.send(bookings);
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
            const query = { categoryID: id };
            const category =  productCollection.find(query);
            const result = await category.toArray();
            res.send(result);
        })


        //users
        app.post('/users', async(req, res) => {
            const user = req.body;
            console.log(user);
            const result = await usersCollection.insertOne(user);
            res.send(result);
        })

        //role
        app.get('/users/seller/', async (req, res) => {
            const query = {};
            const user = await usersCollection.find(query).toArray();
            const filter = user.filter(e => e.role === 'seller')
            res.send(filter);
        })

        
        app.get('/users/buyer/', async (req, res) => {
            const query = {};
            const user = await usersCollection.find(query).toArray();
            const filter = user.filter(e => e.role === 'buyer')
            res.send(filter);

        })

        app.delete('/users/buyer/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await usersCollection.deleteOne(filter);
            res.send(result);
        })

        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({isSeller: user?.role === 'seller'})
        })

        app.patch('/user/:email', async (req, res) => {
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
            res.send({ isAdmin: user?.role === 'admin' });
        })

        //payment
        app.post('/create-payment-intent', async (req, res) => {
            const booking = req.body;
            const price = booking.price;
            const amount = price * 100;

            const paymentIntent = await stripe.paymentIntents.create({
                currency: 'usd',
                amount: amount,
                "payment_method_types": [
                    "card"
                ]
            })
            res.send({
                clientSecret: paymentIntent.client_secret,
            })
        })

        app.post('/payments', async (req, res) => {
            const payment = req.body;
            const result = await paymentsCollection.insertOne(payment);
            const id = payment.bookingId
            const filter = { _id: ObjectId(id) }
            const updatedDoc = {
                $set: {
                    paid: true,
                    transactionId: payment.transactionId
                }
            }
            const updatedResult = await BookingCollection.updateOne(filter, updatedDoc)
            res.send(result);
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