const bodyParser = require('body-parser');
const express = require('express');
const api = require('./api');
const path = require('path');
const data = require('./barcodes.json')
const PORT = 5000;

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs')

app.get('/', (req, res) => res.redirect('/inventory'));
app.get('/inventory', (req, res) => res.render('../views/inventory.ejs', {data}))

app.get('/item', (req, res) => {
  const code = req.query.Barcode;
  console.log(code);
  if(typeof code !== 'string' || code.length !== 12)
    return res.status(400).json({error: "Invalid Barcode"})

  api.networkRequest("get", "/inventory/items/item?Barcode=" + code)
    .then(data => res.status(200).json({
      Name: data.Name,
      Price: data.RetailPrice,
      Barcode: data.Barcode
    }))
    .catch(err => {
      // console.log(err);
      res.status(500).json({error: "Internal server error"})
    });
})

const { MongoClient, ObjectID } = require('mongodb');
const MONGO_CONN = "mongodb+srv://admin:admin@cluster0-e6tqe.mongodb.net/test?retryWrites=true&w=majority";
const DATABASE = "tmp";
var database, collection;

const keytest = /[0-9a-zA-Z]{16}/

app.post('/checkout', (req, res) => {
  const { key, val } = req.body;
  if (typeof key !== 'string' || !keytest.test(key))
    return res.status(400).json({error: "Invalid storage key"});
  collection.insertOne({_id: key, purchaseRecord: val, createdAt: new Date()}, (err, data) => {
    if (err) return res.status(500).json({error});
    res.status(200).json({key});
  })
})

app.delete('/checkout', (req, res) => {
  const { key } = req.body;
  if (typeof key !== 'string' || !keytest.test(key))
    return res.status(400).json({error: "Invalid storage key"});
  collection.findOneAndDelete({_id: key}, (err, data) => {
    if (err) return res.status(500).json({err});
    res.status(200).json(data.value.purchaseRecord);
  })
})

app.listen(PORT, _ => {
  MongoClient.connect(
    MONGO_CONN,
    { useNewUrlParser: true, useUnifiedTopology: true },
    (err, client) => {
      if(err) throw err;
      database = client.db(DATABASE);
      collection = database.collection("records");
      collection.createIndex( { "createdAt": 1 }, { expireAfterSeconds: 3600 } )
      console.log("App is running on port " + PORT + ", connected to " + DATABASE + "!");
    }
  )
})
