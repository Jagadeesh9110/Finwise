import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    // Check for the MONGO_URI, which is a critical part of the setup.
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined in the .env file");
    }

    // Attempt to connect to the MongoDB database.
    await mongoose.connect(process.env.MONGO_URI);

    // --- NEW: Event Listeners for the Database Connection ---

    // This listener will log a confirmation message once the connection is successfully established.
    mongoose.connection.on("connected", () => {
      console.log("✅ Mongoose connected to the database.");
    });

    // This listener will log an error message if the connection encounters an error after the initial setup.
    mongoose.connection.on("error", (err) => {
      console.error("❌ Mongoose connection error:", err);
    });

    // This listener will log a message if the database connection is lost.
    mongoose.connection.on("disconnected", () => {
      console.log(" Mongoose disconnected from the database.");
    });
  } catch (err) {
    console.error(" Initial MongoDB connection failed:", err);
    process.exit(1);
  }
};

// Note: The event listeners will help monitor the connection status throughout the application's lifecycle.
