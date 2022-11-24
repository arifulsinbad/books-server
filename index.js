const express = require('express');
const cors = require('cors');

const { MongoClient, ServerApiVersion } = require('mongodb');
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



app.listen(port, ()=>console.log(`Books server runing ${port}`))