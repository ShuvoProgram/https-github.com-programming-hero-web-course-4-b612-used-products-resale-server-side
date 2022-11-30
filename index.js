const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
// require('colors');
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY)

const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

//generate to access token by default
// require('crypto').randomBytes(64).toString('hex')

const uri = process.env.DB_URI;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

//Verify User 
function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('unauthorized access')
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' })
        }
        req.decoded = decoded;
        next();
    })
}


async function run () {
    try {
        const productCollection = client.db('logistic').collection('products');
        const categoryCollection = client.db('logistic').collection('category');
        const advertisementCollection = client.db('logistic').collection('advertisement');
        const bookingCollection = client.db('logistic').collection('booking');
        const usersCollection = client.db('logistic').collection('users');
        const paymentsCollection = client.db('logistic').collection('payments');

        // verifyAdmin after verifyJWT
        const verifyAdmin = async (req, res, next) => {
            const decodedEmail = req.decoded.email;
            const query = { email: decodedEmail };
            const user = await usersCollection.findOne(query);

            if (user?.role !== 'admin') {
                return res.status(403).send({ message: 'forbidden access' })
            }
            next();
        }

        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '1d' })
                return res.send({ accessToken: token });
            }
            res.status(403).send({ accessToken: '' })
        })

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
        //     const id = req.query.id;
        //     const query = {};
        //     const product = await productCollection.find(query).sort({_id: -1}).toArray();

        //     const bookingQuery = {productId: id};
        //     const alreadyBooked = await bookingCollection.find(bookingQuery).toArray();

        //     product.forEach(booked => {
        //         const optionBooked = alreadyBooked.filter(book => book.productID === booked._id)
        //         // const remainingProduct = booked._id.filter(id => !)
        //         booked._id = optionBooked;
        //     })
        //     res.send(product)
        // })

        app.get('/product', async (req, res) => {
            const email = req.body.email;
            const query = { email: email };
            const products = await productCollection.find(query).sort({ _id: -1 }).limit(8).toArray();
            res.send(products);
        })

        app.get('/products', async (req, res) => {
            const result = await productCollection.find().toArray();
            res.send(result);
        })

        app.put('/products/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const option = { upsert: true }
            const updatedDoc = {
                $set: {
                    report: true,
                }
            }
            const result = await productCollection.updateOne(filter, updatedDoc, option);
            res.send(result)
        })

        app.put('/products/advertisement/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const option = { upsert: true }
            const updatedDoc = {
                $set: {
                    // report: true,
                    advertisement: true
                }
            }
            const result = await productCollection.updateOne(filter, updatedDoc, option);
            res.send(result)
        })

        app.get('/products/advertisement', async (req, res) => {
            const query = {};
            const advertise = await productCollection.find(query).toArray();
            const filter = advertise.filter(e => e.advertisement === true);
            res.send(filter);
        })

        app.put('/products/sold/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const option = { upsert: true }
            const updatedDoc = {
                $set: {
                    // report: true,
                    sold: true
                }
            }
            const result = await productCollection.updateOne(filter, updatedDoc, option);
            res.send(result)
        })

        app.get('/products/sold/', async (req, res) => {
            const query = {
                sold: {
                    $eq: true
                }
            };
            const sold = await productCollection.find(query).toArray();
            res.send(sold);
        })

        app.get('/products/reported', async (req, res) => {
            const query = {}
            const report = await productCollection.find(query).toArray();
            const filter = report.filter(e => e.report === true);
            res.send(filter);
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
            const query = {email: email};
            const bookings = await bookingCollection.find(query).toArray();
            res.send(bookings);
        })

        app.get('/booking/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const booking = await bookingCollection.findOne(query);
            res.send(booking);
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



        //role
        app.put('/users', async (req, res) => {
            const email = req.body.email;
            const data = req.body;
            // console.log(data, email)
            const query = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    name: data.name,
                    email: data.email,
                    role: data.role,
                    photoUrl: data.photoUrl,
                    verify: data.verify
                }
            };
            const result = await usersCollection.updateOne(query, updateDoc, options);
            res.send(result)
            
        });

        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result);
        })


        //users seller
        app.get('/users/seller/', verifyJWT, async (req, res) => {
            const user = await usersCollection.find().toArray();
            const filter = user.filter(e => e.role === 'seller')
            res.send(filter);
        })

        app.get('/users/seller/', async (req, res) => {
            const email = req.query.email;
            const query = {email: email};
            const user = await usersCollection.find(query).toArray();
            const filter = user.filter(e => e.role === 'seller')
            res.send(filter);
        })

        app.get('/user/seller/:email', async(req, res) => {
            const email = req.params.email;
            const query = {email: email}
            const seller = await usersCollection.findOne(query);
            res.send(seller)
        })

        app.put('/users/seller/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const option = { upsert: true }
            const updatedDoc = {
                $set: {
                    status: 'verify'
                }
            }

            const result = await usersCollection.updateOne(filter, updatedDoc, option);
            res.send(result)
        })

        app.delete('/users/seller/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await usersCollection.deleteOne(filter);
            res.send(result);
        })

        app.get('/users/seller/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({ isSeller: user?.role === 'seller' })
        })

        //user buyer

        app.get('/users/buyer/', verifyJWT, async (req, res) => {
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

        app.get('/users/buyer/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({isBuyer: user?.role === 'buyer'})
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
            const price = req.body.price;
            const amount = parseFloat(price * 100);
            try {
                const paymentIntent = await stripe.paymentIntents.create({
                    currency: 'usd',
                    amount: amount,
                    payment_method_types: [
                        "card"
                    ]
                })
                res.send({clientSecret: paymentIntent.client_secret})
                
            } catch (error) {
                console.log(error)
            }
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
            const updatedResult = await bookingCollection.updateOne(filter, updatedDoc)
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