# LeadFlow

LeadFlow is a full-stack lead generation and prioritization platform designed to help users discover, evaluate, and prioritize potential business leads through structured data and intelligent lead scoring.

## Live Demo

Frontend: https://leadflow-tau-three.vercel.app/

Backend API: https://leadflow-g15cqdp8.b4a.run/

## Overview

LeadFlow provides a simple workflow for finding potential leads, filtering them based on relevant criteria, reviewing business information, and prioritizing opportunities using a deterministic scoring system.

The project focuses on making lead discovery faster and helping users identify the most promising opportunities first.

## Features

- Lead discovery dashboard
- Search by company, industry, or location
- Industry filtering
- Minimum score filtering
- Intelligent lead scoring
- Transparent score breakdown
- Lead fit classification
- Lead details and business intelligence
- Save leads for later review
- CSV export
- Dashboard statistics
- Insights section
- Responsive design

## Tech Stack

### Frontend

- React
- Vite
- Tailwind CSS
- Lucide React

### Backend

- Node.js
- Express.js
- REST API
- CORS
- Mongoose

### Database

- MongoDB Atlas

### Deployment

- Vercel
- Back4app

## Lead Scoring

LeadFlow uses a deterministic scoring system to prioritize leads.

The score is calculated using three main factors:

- Revenue
- Number of employees
- Industry

Each factor contributes to the overall lead score.

Leads are classified into:

- Excellent Fit
- Strong Fit
- Potential Fit

The scoring breakdown gives users a transparent explanation of how each lead is prioritized.

## API Endpoints

### Get Leads

```text
GET /api/leads