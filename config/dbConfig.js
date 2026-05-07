import mongoose from "mongoose";

mongoose.set("bufferCommands", false);

const connection = mongoose.connection;

connection.on('connected', ()=>{
    console.log('Mongo db connected');
});

connection.on('error', (error)=>{
    console.log("Error :",error);
})

const connectDB = async () => {
    if (!process.env.MONGO_URL) {
        throw new Error('MONGO_URL is not set.');
    }

    await mongoose.connect(process.env.MONGO_URL);
};

export default connectDB;
