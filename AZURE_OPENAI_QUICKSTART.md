# Azure OpenAI Integration - Quick Start Guide

## What Changed?

The itinerary generation now uses **Azure OpenAI (GPT-4/GPT-3.5)** instead of a small local model. This means:

✅ **Much smarter planning** - AI understands context and makes intelligent decisions  
✅ **Intelligent hotel selection** - Picks best hotels based on location, quality, and price  
✅ **MyLens support** - Can incorporate user interests from myLens  
✅ **Time-aware** - Respects activity timing (beaches before 6 PM, parties after 9 PM, etc.)  
✅ **Accurate day counts** - Always generates exactly the number of days requested  

## Quick Setup (5 minutes)

### 1. Install Dependencies

```bash
cd /Users/int1934/myCommunity/ai-service
pip install openai>=1.58.1
```

### 2. Create .env File

Create `/Users/int1934/myCommunity/ai-service/.env` with:

```env
AZURE_OPENAI_API_KEY=your-api-key-here
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_VERSION=2024-02-15-preview
AZURE_CHAT_DEPLOYMENT=your-deployment-name
```

### 3. Get Azure Credentials

1. Go to [Azure Portal](https://portal.azure.com)
2. Open your Azure OpenAI resource
3. **Keys and Endpoint** → Copy Key 1 and Endpoint
4. **Model deployments** → Copy deployment name

### 4. Restart AI Service

```bash
cd /Users/int1934/myCommunity/ai-service
python3 main.py
```

## Automated Setup

Or use the setup script:

```bash
cd /Users/int1934/myCommunity/ai-service
./setup_azure_openai.sh
```

Then edit `.env` with your Azure credentials.

## Testing

1. **Add activities and hotels to cart** in the frontend
2. **Click "Generate Itinerary"**
3. **Check logs** - you should see:
   ```
   [AzureItineraryService] Initialized with deployment: your-deployment
   [Azure OpenAI] Successfully generated 3 days as requested
   ```

## Fallback System

Don't worry if Azure fails - the system has fallbacks:

1. **Azure OpenAI** (tries first)
2. **Local LLM** (if Azure fails)
3. **Deterministic Scheduler** (always works)

## What If I Don't Have Azure?

The system will automatically fall back to the local LLM and deterministic scheduler. It will still work, just not as intelligently.

## Cost

Azure OpenAI charges per API call:
- **GPT-4**: ~$0.15 per itinerary
- **GPT-3.5-turbo**: ~$0.015 per itinerary (10x cheaper)

For development, GPT-3.5-turbo is recommended.

## Files Changed

### New Files
- `ai-service/services/azure_itinerary_service.py` - Azure OpenAI integration
- `ai-service/ENV_SETUP_INSTRUCTIONS.md` - Detailed setup guide
- `ai-service/setup_azure_openai.sh` - Automated setup script
- `AZURE_OPENAI_INTEGRATION.md` - Complete documentation
- `AZURE_OPENAI_QUICKSTART.md` - This file

### Modified Files
- `ai-service/config.py` - Added Azure config
- `ai-service/services/activity_recommendation_service.py` - Uses Azure OpenAI
- `ai-service/main.py` - Added myLens support
- `backend/routes/chats.js` - Passes myLens data
- `ai-service/requirements.txt` - Added openai package

## Troubleshooting

### "API key not found"
→ Check `.env` file exists in `ai-service/` directory

### "Deployment not found"
→ Verify deployment name matches Azure Portal

### Falls back to local LLM
→ Azure credentials are incorrect or service is down

### Still using deterministic scheduler
→ Both LLMs failed, but itinerary will still be generated

## Need Help?

See detailed documentation:
- **Setup**: `ENV_SETUP_INSTRUCTIONS.md`
- **Integration**: `AZURE_OPENAI_INTEGRATION.md`
- **Azure Portal**: https://portal.azure.com

---

**Ready to test?** Add some activities and hotels to your cart and generate an itinerary! 🎉
