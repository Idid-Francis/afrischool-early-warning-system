# Afrischool Early Warning System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Research Use](https://img.shields.io/badge/Purpose-Research-blue.svg)]()
[![ML Enhanced](https://img.shields.io/badge/ML-Demo_Integration-orange.svg)]()

> **⚠️ IMPORTANT DISCLAIMER:** This is a **RESEARCH DEMONSTRATION** tool. It is NOT intended for autonomous decision-making about students. All risk assessments should be reviewed by qualified educators and administrators before any action is taken.

## Purpose

This repository demonstrates an algorithmic approach to identifying students who may be at risk of dropping out or experiencing academic difficulties. The system combines:

- Rule-based risk scoring (attendance, academics, finances)
- Optional ML API integration for enhanced predictions
- Interactive visualization of risk factors
- Intervention suggestion framework

## Ethical Statement

We believe educational technology should be **transparent, explainable, and human-centered**:

- **No autonomous decisions** - Final decisions always involve human judgment
- **Explainable outputs** - Every risk score includes reasoning
- **Privacy by design** - No real student data in this demo
- **Bias awareness** - Algorithms can reflect historical biases; use critically

## Features

| Feature | Description |
|---------|-------------|
| 📊 Multi-factor scoring | Attendance (35%), Academics (40%), Fees (15%), Trends (10%) |
| 🤖 ML integration | Optional external API for advanced predictions |
| 📈 Interactive charts | Risk distribution, subject weakness analysis |
| 🎯 Intervention suggestions | Automated recommendations based on risk factors |
| 📁 CSV export | Download risk reports for further analysis |
| ⚙️ Configurable thresholds | Adjust risk levels to your context |

## Quick Start

### Prerequisites

- Modern web browser (Chrome, Firefox, Safari)
- Local web server (optional - works with file:// but charts may have issues)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/afrischool-early-warning-system.git

# Navigate to project directory
cd afrischool-early-warning-system

# Start a local server (recommended)
python -m http.server 8000
# OR
npx serve .

# Open browser to http://localhost:8000/dashboard/
