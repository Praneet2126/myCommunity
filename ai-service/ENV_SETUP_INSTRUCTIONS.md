# Environment Setup Instructions for Azure OpenAI Integration

## Where to Create the .env File

Create a `.env` file in the **`ai-service/`** directory:

```
/Users/int1934/myCommunity/ai-service/.env
```

## Required Environment Variables

Add the following variables to your `.env` file:

```env
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
```

## How to Get Azure OpenAI Credentials

1. **Azure Portal**: Go to [https://portal.azure.com](https://portal.azure.com)

2. **Navigate to your Azure OpenAI Resource**:
   - Search for "Azure OpenAI" in the search bar
   - Click on your OpenAI resource

3. **Get API Key**:
   - Go to "Keys and Endpoint" in the left sidebar
   - Copy **Key 1** or **Key 2**
   - Paste it as `AZURE_OPENAI_API_KEY`

4. **Get Endpoint**:
   - In the same "Keys and Endpoint" page
   - Copy the **Endpoint** URL (e.g., `https://your-resource-name.openai.azure.com/`)
   - Paste it as `AZURE_OPENAI_ENDPOINT`

5. **Get Deployment Name**:
   - Go to "Model deployments" in the left sidebar
   - Click "Manage Deployments" (opens Azure OpenAI Studio)
   - Find your chat model deployment (e.g., GPT-4, GPT-3.5-turbo)
   - Copy the **Deployment name**
   - Paste it as `AZURE_CHAT_DEPLOYMENT`

6. **API Version**:
   - Use `2024-02-15-preview` (already set in the example)
   - Or check Azure OpenAI documentation for the latest version

## Example .env File

```env
# Example with real values (replace with your own)
AZURE_OPENAI_API_KEY=abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
AZURE_OPENAI_ENDPOINT=https://my-openai-resource.openai.azure.com/
AZURE_OPENAI_API_VERSION=2024-02-15-preview
AZURE_CHAT_DEPLOYMENT=gpt-4-deployment
```

## Installation Steps

1. **Navigate to ai-service directory**:
   ```bash
   cd /Users/int1934/myCommunity/ai-service
   ```

2. **Install the new dependency**:
   ```bash
   pip install openai>=1.58.1
   ```
   
   Or install all requirements:
   ```bash
   pip install -r requirements.txt
   ```

3. **Create the .env file**:
   ```bash
   touch .env
   ```

4. **Edit the .env file** with your Azure credentials (use nano, vim, or any text editor):
   ```bash
   nano .env
   ```

5. **Restart the AI service**:
   ```bash
   python main.py
   ```

## Testing

Once configured, the itinerary generation will automatically use Azure OpenAI for intelligent planning. The system will:

1. **Try Azure OpenAI first** (most capable)
2. **Fallback to local LLM** if Azure fails
3. **Fallback to deterministic scheduler** as final backup

## Verification

Check the logs when generating an itinerary. You should see:

```
[AzureItineraryService] Initialized with deployment: your-deployment-name
[Itinerary] Activities: X, Hotels: Y, MyLens: Z
[Azure OpenAI] Successfully generated N days as requested
```

If you see errors like "API key not found", double-check your `.env` file configuration.
