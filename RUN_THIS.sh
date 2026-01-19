#!/bin/bash
echo "=========================================="
echo "🚀 Starting LLM Service on Port 8000"
echo "=========================================="
cd "/Users/int1927/Documents/_myCommunity__/activities rec from chat"
echo "📁 Current directory: $(pwd)"
echo "🔍 Checking for main.py..."
if [ -f "main.py" ]; then
    echo "✅ main.py found!"
else
    echo "❌ main.py not found!"
    exit 1
fi

echo "🔍 Checking for goa_activities.json..."
if [ -f "goa_activities.json" ]; then
    echo "✅ goa_activities.json found!"
else
    echo "❌ goa_activities.json not found!"
    exit 1
fi

echo "🐍 Activating virtual environment..."
source venv/bin/activate

echo "🚀 Starting LLM service..."
echo "=========================================="
echo "Press Ctrl+C to stop"
echo "=========================================="
python main.py
