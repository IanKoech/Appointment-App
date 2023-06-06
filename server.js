const express =  require('express');

const app = express();
require('dotenv').config()
const port = process.env.PORT || 5000;

console.log(process.env.MONGO_URL);
app.listen(port, ()=> {console.log(`Node server started at ${port}`)})