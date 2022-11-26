const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
require('dotenv').config()
const port = process.env.PORT || 5000;
app.use(cors())
app.use(express.json())
app.get('/', (req, res)=>{
 res.send('Books Server Connect')
})


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.y2sfurg.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next){
  console.log()
  const authHeader = req.headers.authorization
  if(!authHeader){
    return res.status(401).send('unAuthorized Access')
  }
  const token = authHeader.split(' ')[1];
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
const userInfoCollection = client.db('booksMarket').collection('UserInfo')
const addProductCollection = client.db('booksMarket').collection('addProduct')
const usersCollection = client.db('booksMarket').collection('users')
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

app.post('/users', async(req, res)=>{
  const user = req.body;
  console.log(user)
  const users = await usersCollection.insertOne(user)
  res.send(users)
})
app.get('/users', async (req, res)=>{
  const query = {}
  const users = await usersCollection.find(query).toArray()
  res.send(users)
})

app.post('/userInfo', async(req, res)=>{
  const info = req.body;
  const productInfo = await userInfoCollection.insertOne(info)
  res.send(productInfo)
})
app.get('/userInfo',verifyJWT, async (req, res)=>{
  // const query = {}
  const email = req.query.email;
  const decodedEmail = req.decoded.email;
  if(email !== decodedEmail){
   return res.status(403).send({message: 'forbidden access'})
  }

  const query = {email: email}
  const result = await userInfoCollection.find(query).toArray()
  res.send(result)
})
app.post('/addProduct', async (req, res)=>{
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
app.get('/jwt', async(req, res)=>{
  const email = req.query.email;
  const query = {email: email}
  const user = await usersCollection.findOne(query)
  if(user){
    const token = jwt.sign({email}, process.env.ACCESS_TOKEN, {expiresIn: '1h'})
    return res.send({accessToken: token})
  }
  console.log(user)
  res.status(403).send({accessToken: ''})
})
  }
  finally{

  }
}
run().catch(err=>console.log(err))


app.listen(port, ()=>console.log(`Books server runing ${port}`))