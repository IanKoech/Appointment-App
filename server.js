import express from 'express';
const app = express();
import 'dotenv/config';
import dbConfig from './config/dbConfig.js';

app.use(express.json()); 

import userRoute from './routes/userRoute.js';
import adminRoute from './routes/adminRoute.js';
import doctorRoute from './routes/doctorsRoute.js';


app.use('/api/user/', userRoute);
app.use('/api/admin/', adminRoute);
app.use('/api/doctor', doctorRoute);

const port = process.env.PORT || 5000;
 
app.listen(port, ()=> {console.log(`Node server started at ${port}`)}) 