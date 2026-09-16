const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const leadSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      required: true,
      unique: true,
    },
    company: {
      type: String,
      required: true,
    },
    industry: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    revenue: {
      type: String,
      required: true,
    },
    employees: {
      type: Number,
      required: true,
    },
    score: {
      type: Number,
      default: 0,
    },
    fit: {
      type: String,
      default: "Potential Fit",
    },
    reason: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Lead = mongoose.model("Lead", leadSchema);

function calculateLeadScore(lead) {
  let revenueScore = 0;
  let employeeScore = 0;
  let industryScore = 0;

  const revenue = parseFloat(
    String(lead.revenue).replace(/[$M,]/g, "")
  );

  if (revenue >= 8) {
    revenueScore = 35;
  } else if (revenue >= 5) {
    revenueScore = 30;
  } else if (revenue >= 3) {
    revenueScore = 25;
  } else {
    revenueScore = 20;
  }

  if (lead.employees >= 50) {
    employeeScore = 30;
  } else if (lead.employees >= 30) {
    employeeScore = 25;
  } else if (lead.employees >= 20) {
    employeeScore = 20;
  } else {
    employeeScore = 15;
  }

  const strongIndustries = [
    "SaaS",
    "Industrial Services",
    "Manufacturing",
  ];

  if (strongIndustries.includes(lead.industry)) {
    industryScore = 35;
  } else if (lead.industry === "Logistics") {
    industryScore = 30;
  } else {
    industryScore = 25;
  }

  const totalScore = Math.min(
    revenueScore + employeeScore + industryScore,
    100
  );

  let fit = "Potential Fit";

  if (totalScore >= 85) {
    fit = "Excellent Fit";
  } else if (totalScore >= 75) {
    fit = "Strong Fit";
  }

  return {
    score: totalScore,
    fit,
    breakdown: {
      revenue: revenueScore,
      employees: employeeScore,
      industry: industryScore,
    },
  };
}

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "LeadFlow API is running",
  });
});

app.get("/api/leads", async (req, res) => {
  try {
    const {
      search,
      industry,
      minScore,
    } = req.query;

    const filter = {};

    if (search) {
      filter.$or = [
        {
          company: {
            $regex: search,
            $options: "i",
          },
        },
        {
          location: {
            $regex: search,
            $options: "i",
          },
        },
        {
          industry: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    if (
      industry &&
      industry !== "All Industries"
    ) {
      filter.industry = industry;
    }

    const leads = await Lead.find(filter).sort({
      id: 1,
    });

    const scoredLeads = leads
      .map((lead) => {
        const scoring = calculateLeadScore(lead);

        return {
          ...lead.toObject(),
          score: scoring.score,
          fit: scoring.fit,
        };
      })
      .filter((lead) => {
        if (
          !minScore ||
          minScore === "All Scores"
        ) {
          return true;
        }

        return lead.score >= Number(minScore);
      })
      .sort((a, b) => b.score - a.score);

    res.json({
      success: true,
      count: scoredLeads.length,
      leads: scoredLeads,
    });
  } catch (error) {
    console.error(
      "Failed to fetch leads:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch leads",
    });
  }
});

app.get("/api/leads/:id/score", async (req, res) => {
  try {
    const lead = await Lead.findOne({
      id: Number(req.params.id),
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found",
      });
    }

    const scoring = calculateLeadScore(lead);

    res.json({
      success: true,
      lead: {
        id: lead.id,
        company: lead.company,
      },
      ...scoring,
    });
  } catch (error) {
    console.error(
      "Failed to calculate score:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Failed to calculate lead score",
    });
  }
});

app.get("/api/leads/:id", async (req, res) => {
  try {
    const lead = await Lead.findOne({
      id: Number(req.params.id),
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found",
      });
    }

    const scoring = calculateLeadScore(lead);

    res.json({
      success: true,
      lead: {
        ...lead.toObject(),
        score: scoring.score,
        fit: scoring.fit,
        breakdown: scoring.breakdown,
      },
    });
  } catch (error) {
    console.error(
      "Failed to fetch lead:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch lead",
    });
  }
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");

    app.listen(PORT, () => {
      console.log(
        `LeadFlow API running on http://localhost:${PORT}`
      );
    });
  })
  .catch((error) => {
    console.error(
      "MongoDB connection failed:",
      error.message
    );
  });