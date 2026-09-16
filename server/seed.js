const mongoose = require("mongoose");
require("dotenv").config();

const leadSchema = new mongoose.Schema({
  id: Number,
  company: String,
  industry: String,
  location: String,
  revenue: String,
  employees: Number,
  score: Number,
  fit: String,
  reason: String,
});

const Lead = mongoose.model("Lead", leadSchema);

const leads = [
  {
    id: 1,
    company: "Northstar Manufacturing",
    industry: "Manufacturing",
    location: "Austin, TX",
    revenue: "$8.4M",
    employees: 62,
    score: 94,
    fit: "Excellent Fit",
    reason: "Strong revenue, scalable operations, and attractive acquisition profile.",
  },
  {
    id: 2,
    company: "Vertex Industrial Group",
    industry: "Industrial Services",
    location: "Dallas, TX",
    revenue: "$6.7M",
    employees: 48,
    score: 88,
    fit: "Excellent Fit",
    reason: "Established business with strong operating fundamentals.",
  },
  {
    id: 3,
    company: "BluePeak Software",
    industry: "SaaS",
    location: "Denver, CO",
    revenue: "$4.9M",
    employees: 35,
    score: 81,
    fit: "Strong Fit",
    reason: "Recurring revenue model with strong growth potential.",
  },
  {
    id: 4,
    company: "Summit Equipment Co.",
    industry: "Manufacturing",
    location: "Phoenix, AZ",
    revenue: "$3.8M",
    employees: 29,
    score: 76,
    fit: "Strong Fit",
    reason: "Healthy business with a clear acquisition opportunity.",
  },
  {
    id: 5,
    company: "Crestline Logistics",
    industry: "Logistics",
    location: "Atlanta, GA",
    revenue: "$2.6M",
    employees: 24,
    score: 68,
    fit: "Potential Fit",
    reason: "Promising company with moderate acquisition signals.",
  },
];

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("MongoDB connected");

    await Lead.deleteMany({});
    await Lead.insertMany(leads);

    console.log("5 leads inserted successfully");

    await mongoose.connection.close();
  })
  .catch((error) => {
    console.error("Seed failed:", error.message);
  });