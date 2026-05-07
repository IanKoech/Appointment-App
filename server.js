import express from 'express';
const app = express();
import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/dbConfig.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json({ limit: '1mb' }));
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'same-origin');
  next();
});
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));

import userRoute from './routes/userRoute.js';
import adminRoute from './routes/adminRoute.js';
import doctorRoute from './routes/doctorsRoute.js';


app.use('/api/user/', userRoute);
app.use('/api/admin/', adminRoute);
app.use('/api/doctor', doctorRoute);

app.get('/health', (_req, res) => {
  res.status(200).send({ success: true, message: 'Appointment API is running' });
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const port = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`Node server started at ${port}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection failed:', error.message);
    console.error('Start MongoDB locally, then run npm start again.');
    process.exit(1);
  });
