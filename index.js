const express = require('express')
const cors = require('cors');
require ('dotenv').config();


const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express()
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.pfczh.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
    try{
        await client.connect();
        const serviceCollection =  client.db('doctors-portal').collection('services');
        const bookingCollection =  client.db('doctors-portal').collection('bookings');

        app.get('/service', async(req, res) =>{
          const query = {}
          const cursor = serviceCollection.find(query);
          const services =await cursor.toArray();
          res.send(services);
        });

        app.get('/available', async(req, res) =>{
          const date = req.query.date;
          const services = await serviceCollection.find().toArray();
          const query = {date};
          const booking = await bookingCollection.find(query).toArray();
          services.forEach(service =>{
            const serviceBookings = booking.filter(book => book.treatment === service.name);
            const bookedSlots = serviceBookings.map(book=> book.slot);
            const available = service.slots.filter(slot=>!bookedSlots.includes(slot));
            service.slots = available;
            // service.booked = serviceBookings.map(s > s.slot);
          })
          res.send(services);

        })

        app.post('/booking', async(req, res) =>{
          const booking = req.body;
          const query ={
            treatment: booking.treatment, data: booking.data, patient: booking.patient
          }
          const exists = await bookingCollection.findOne(query);
          if(exists){
            return res.send({success: false, booking: exists})
          }
          const result = await bookingCollection.insertOne(booking);
          return res.send({success: true, result});

        })
    }
    finally{

    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Hello from doctur uncle!')
})

app.listen(port, () => {
  console.log(`Doctor app listening on port ${port}`)
})