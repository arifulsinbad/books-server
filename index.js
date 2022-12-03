const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
require('dotenv').config()
const stripe = require("stripe")(process.env.STRIPE_SECRET);

const port = process.env.PORT || 5000;
app.use(cors())
app.use(express.json())
app.get('/', (req, res)=>{
 res.send('Books Server Connect')
})


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.y2sfurg.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next){

  const authHeaders = req.headers.authorization;
  if(!authHeaders){
    return res.status(401).send('unAuthorized Access')
  }
  const token = authHeaders.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN, function(err, decoded){
    if(err){
      return res.status(403).send({message: 'forbidden access'})
    }
    req.decoded = decoded;
    next()
  })
}



async function run(){
  try{
const productsCollection = client.db('booksMarket').collection('products')
const userInfoCollection = client.db('booksMarket').collection('userInfo')
const addProductCollection = client.db('booksMarket').collection('addProduct')
const usersCollection = client.db('booksMarket').collection('users')
const paymentsCollection = client.db('booksMarket').collection('payments')
const advertisementCollection = client.db('booksMarket').collection('advertisement')
const reportCollection = client.db('booksMarket').collection('report')
app.get('/products', async (req, res)=>{
  const query = {}
  const products = await productsCollection.find(query).toArray()
  res.send(products)
})
app.get('/products/:id', async (req, res)=>{
  const id = req.params.id;
  const query = {_id: ObjectId(id)}
  const result = await productsCollection.findOne(query)
  res.send(result)
})
app.get('/productSpacialty', async(req, res)=>{
  const query = {}
  const result = await productsCollection.find(query).project({name: 1}).toArray()
  res.send(result)
})

app.post('/advertisement',verifyJWT, async (req, res)=>{
  const advertisement  =req.body;
  const result = await advertisementCollection.insertOne(advertisement)
  res.send(result)
})

app.get('/advertisement', async (req, res)=>{
  const query = {}
  const result = await advertisementCollection.find(query).toArray()
  res.send(result)
})

app.post('/report',verifyJWT, async(req, res)=>{
  const report = req.body
  const result = await reportCollection.insertOne(report)
  res.send(result)
})
app.get('/report',verifyJWT, async(req, res)=>{
  const report = {}
  const result = await reportCollection.find(report).toArray()
  res.send(result)
})
app.delete('/report/delete/:id',verifyJWT, async(req, res)=>{
  const id = req.params.id;
const query = {_id: ObjectId(id)}
  const result = await reportCollection.deleteOne(query)
  res.send(result)
})

app.post("/create-payment-intent",verifyJWT, async(req, res)=>{
  const userInfo = req.body;
  const price = parseInt(userInfo.price);
  const amount = price * 100;
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount,
    currency: 'usd',
    "payment_method_types": [
      "card"
    ],
  });
  
  res.send({
    clientSecret: paymentIntent.client_secret,
  });
})
app.post('/payments',verifyJWT, async (req, res)=>{
  const payment = req.body;
  const payments = await paymentsCollection.insertOne(payment)
const id = payment.bookingId
const filter = {_id: ObjectId(id)}
const updateDoc = {
  $set:{
    paid: true,
    transactionId: payment.transactionId
  }
}
const result = await userInfoCollection.updateOne(filter, updateDoc)

  res.send(payments)
})

app.post('/users', async(req, res)=>{
  const user = req.body;
  console.log(user)
  const users = await usersCollection.insertOne(user)
  res.send(users)
})
app.get('/users',verifyJWT, async (req, res)=>{
  const query = {}
  const users = await usersCollection.find(query).toArray()
  res.send(users)
})

app.post('/userInfo',verifyJWT, async(req, res)=>{
  const info = req.body;
  const id = info.sellerId;
  const productInfo = await userInfoCollection.insertOne(info)
  const filter = {_id: ObjectId(id)}
  const filters = {sellerId: id}
  const updateDoc = {
    $set:{
      sold: 'Out of Stock'
    }
  }
  
  const advertisement = await advertisementCollection.updateOne(filters, updateDoc)
  const result = await addProductCollection.updateOne(filter, updateDoc)
cel
  res.send(productInfo)
})
app.get('/userInfo', async(req, res)=>{
  const query = {}
  const result = await userInfoCollection.find(query).toArray()
  res.send(result)
})
app.get('/userInfo',verifyJWT, async (req, res)=>{
  // const query = {}

  const email = req.query.email;
  const decodedEmail = req.decoded.email;
  if(email !== decodedEmail){
   return res.status(403).send({message: 'forbidden access'})
  }
  const filter = {email: email}
  const result = await userInfoCollection.find(filter).toArray()
  res.send(result)
  
})


app.delete('/userInfo/delete/:id',verifyJWT, async (req, res)=>{
  const id = req.params.id;
  const query = {_id: ObjectId(id)}
  const result = await userInfoCollection.deleteOne(query)
  res.send(result)
})

app.get('/userInfo/:id', async (req, res)=>{
  const id = req.params.id;
  const filter = {_id: ObjectId(id)}
  const result = await userInfoCollection.findOne(filter)

  res.send(result)
})
app.post('/addProduct',verifyJWT, async (req, res)=>{
  const addProduct = req.body;
  // console.log(addProduct)
  const result = await addProductCollection.insertOne(addProduct)
  // const result = await addProductCollection.insertOne(addProduct)
  res.send(result)
})
app.get('/addProduct', async (req, res)=>{
  const query ={}
  const result = await addProductCollection.find(query).toArray()
  res.send(result)
})
// app.get('/addProduct/:id', async (req, res)=>{
//   const id = req.params.id
//   const filter = {_id: ObjectId(id)}
//   const result =await addProductCollection.findOne(filter)
//   res.send(result)
// })


app.get('/jwt', async(req, res)=>{
  const email = req.query.email;
  const query = {email: email}
  const user = await usersCollection.findOne(query)
  // console.log(user)
  if(user){
    const token = jwt.sign({email}, process.env.ACCESS_TOKEN, {expiresIn: '1h'})
    return res.send({accessToken: token})
  }
  // console.log(user)
  res.status(403).send({accessToken: ''})
})

app.get('/users/user/:email',verifyJWT, async (req, res)=>{
  const email = req.params.email;
  const query = {email: email}
  
  const user = await usersCollection.findOne(query)

  res.send({
    isSeller: user?.user === 'seller',
    isAdmin: user?.role === 'admin',
    isVerify: user?.veryfied === 'Veryfied'
})
app.delete('/users/delete/:id',verifyJWT, async (req, res)=>{
  const id = req.params.id;
  const query = {_id: ObjectId(id)}
  const result = await usersCollection.deleteOne(query)
  res.send(result)
})

app.delete('/users/report/:id',verifyJWT, async (req, res)=>{
  const id = req.params.id;
  const query = {_id: ObjectId(id)}
  const result = await addProductCollection.deleteOne(query)
  res.send(result)
})
})
app.get('/myProduct',verifyJWT, async (req, res)=>{
  const email = req.query.email;
  const query ={email: email}
  const result = await addProductCollection.find(query).toArray()
  res.send(result)
})
app.put('/users/verify/:email',verifyJWT, async (req, res)=>{

  const email = req.params.email;
  const filter = {email: email}

  const option = {upsert: true}
  const updateDoc = {
    $set:{
      veryfied: 'Veryfied'
    }
  }
 
const addProduct = await addProductCollection.updateMany(filter, updateDoc, option)
const dvertisement = await advertisementCollection.updateMany(filter, updateDoc, option)
const result = await usersCollection.updateOne(filter, updateDoc, option)
  res.send(result)
})

app.put('/users/admin/:id',verifyJWT, async (req, res)=>{
  const decodedEmail = req.decoded.email;
  const query = {email: decodedEmail}
  const user = await usersCollection.findOne(query)
  if(user?.role !== 'admin'){
  return  res.status(403).send({message: 'Forbidden Access'})
  }
  const id = req.params.id

const filter = {_id: ObjectId(id)}
const option = {upsert: true}
const updateDoc = {
  $set: {
    role: 'admin',
    
 }
}
const result = await usersCollection.updateOne(filter, updateDoc, option)
res.send(result)
})
  }
  finally{

  }
}
run().catch(err=>console.log(err))


app.listen(port, ()=>console.log(`Books server runing ${port}`))