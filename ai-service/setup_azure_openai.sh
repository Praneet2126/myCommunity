#!/bin/bash

# Azure OpenAI Setup Script for Itinerary Generation
# This script helps set up the Azure OpenAI integration

set -e

echo "=========================================="
echo "Azure OpenAI Setup for Itinerary Service"
echo "=========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "main.py" ]; then
    echo "❌ Error: Please run this script from the ai-service directory"
    echo "   cd /Users/int1934/myCommunity/ai-service"
    exit 1
fi

echo "✅ Running from ai-service directory"
echo ""

# Step 1: Install dependencies
echo "📦 Step 1: Installing dependencies..."
if command -v pip3 &> /dev/null; then
    pip3 install openai>=1.58.1
elif command -v pip &> /dev/null; then
    pip install openai>=1.58.1
else
    echo "❌ Error: pip not found. Please install Python and pip first."
    exit 1
fi
echo "✅ Dependencies installed"
echo ""

# Step 2: Check for .env file
echo "🔍 Step 2: Checking for .env file..."
if [ -f ".env" ]; then
    echo "✅ .env file exists"
    
    # Check if Azure variables are set
    if grep -q "AZURE_OPENAI_API_KEY" .env && grep -q "AZURE_OPENAI_ENDPOINT" .env; then
        echo "✅ Azure OpenAI variables found in .env"
        
        # Check if they have actual values (not placeholder)
        if grep -q "AZURE_OPENAI_API_KEY=your-" .env; then
            echo "⚠️  Warning: AZURE_OPENAI_API_KEY appears to be a placeholder"
            echo "   Please update it with your actual API key"
        fi
        
        if grep -q "AZURE_OPENAI_ENDPOINT=https://your-" .env; then
            echo "⚠️  Warning: AZURE_OPENAI_ENDPOINT appears to be a placeholder"
            echo "   Please update it with your actual endpoint"
        fi
    else
        echo "⚠️  Warning: Azure OpenAI variables not found in .env"
        echo "   Adding template variables..."
        echo "" >> .env
        echo "# Azure OpenAI Configuration" >> .env
        echo "AZURE_OPENAI_API_KEY=your-azure-openai-api-key-here" >> .env
        echo "AZURE_OPENAI_ENDPOINT=https://your-resource-name.openai.azure.com/" >> .env
        echo "AZURE_OPENAI_API_VERSION=2024-02-15-preview" >> .env
        echo "AZURE_CHAT_DEPLOYMENT=your-deployment-name-here" >> .env
        echo "✅ Template variables added to .env"
    fi
else
    echo "⚠️  .env file not found. Creating from template..."
    cat > .env << 'EOF'
# AI Service Configuration
HOST=0.0.0.0
PORT=8001
DEBUG=True

# Backend Configuration
BACKEND_URL=http://localhost:3000
BACKEND_API_KEY=your-backend-api-key-here

# Frontend Configuration
FRONTEND_URL=http://localhost:5173
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Azure OpenAI Configuration (REQUIRED for itinerary generation)
AZURE_OPENAI_API_KEY=your-azure-openai-api-key-here
AZURE_OPENAI_ENDPOINT=https://your-resource-name.openai.azure.com/
AZURE_OPENAI_API_VERSION=2024-02-15-preview
AZURE_CHAT_DEPLOYMENT=your-deployment-name-here

# Service Configuration
AI_SERVICE_TIMEOUT=30
MODERATION_THRESHOLD=0.7
MAX_SIMILAR_HOTELS=10
EOF
    echo "✅ .env file created with template"
fi
echo ""

# Step 3: Verify Python can import openai
echo "🔍 Step 3: Verifying OpenAI package..."
if python3 -c "import openai; print('OpenAI version:', openai.__version__)" 2>/dev/null; then
    echo "✅ OpenAI package installed and importable"
else
    echo "❌ Error: Could not import openai package"
    exit 1
fi
echo ""

# Step 4: Test configuration loading
echo "🔍 Step 4: Testing configuration..."
if python3 -c "from config import settings; print('Endpoint:', settings.AZURE_OPENAI_ENDPOINT); print('Deployment:', settings.AZURE_CHAT_DEPLOYMENT)" 2>/dev/null; then
    echo "✅ Configuration loads successfully"
else
    echo "❌ Error: Could not load configuration"
    exit 1
fi
echo ""

# Final instructions
echo "=========================================="
echo "✅ Setup Complete!"
echo "=========================================="
echo ""
echo "📝 Next Steps:"
echo ""
echo "1. Update your .env file with Azure credentials:"
echo "   - Get API Key from Azure Portal → Your OpenAI Resource → Keys and Endpoint"
echo "   - Get Endpoint URL from the same page"
echo "   - Get Deployment Name from Model deployments page"
echo ""
echo "2. Edit the .env file:"
echo "   nano .env"
echo "   # or use your preferred editor"
echo ""
echo "3. Restart the AI service:"
echo "   python3 main.py"
echo ""
echo "4. Test itinerary generation from the frontend!"
echo ""
echo "📚 For detailed instructions, see:"
echo "   - ENV_SETUP_INSTRUCTIONS.md"
echo "   - AZURE_OPENAI_INTEGRATION.md"
echo ""
echo "🔗 Get Azure credentials from:"
echo "   https://portal.azure.com"
echo ""
