# Azure OpenAI Setup Checklist

## ✅ Quick Setup Checklist

Follow these steps to get Azure OpenAI working for itinerary generation:

### Step 1: Install Dependencies ⏱️ 1 minute

```bash
cd /Users/int1934/myCommunity/ai-service
pip install openai>=1.58.1
```

**Expected output**: `Successfully installed openai-1.58.1`

---

### Step 2: Get Azure Credentials ⏱️ 2 minutes

1. Open [Azure Portal](https://portal.azure.com)
2. Navigate to your **Azure OpenAI** resource
3. Click **"Keys and Endpoint"** in left sidebar
4. Copy the following:
   - ✅ **Key 1** (or Key 2)
   - ✅ **Endpoint** URL

5. Click **"Model deployments"** in left sidebar
6. Click **"Manage Deployments"** (opens Azure OpenAI Studio)
7. Copy your **Deployment name** (e.g., `gpt-4-deployment` or `gpt-35-turbo`)

---

### Step 3: Create .env File ⏱️ 2 minutes

**Location**: `/Users/int1934/myCommunity/ai-service/.env`

```bash
cd /Users/int1934/myCommunity/ai-service
nano .env
```

**Paste this template and fill in your values**:

```env
# AI Service Configuration
HOST=0.0.0.0
PORT=8001
DEBUG=True

# Backend Configuration
BACKEND_URL=http://localhost:3000

# Frontend Configuration
FRONTEND_URL=http://localhost:5173
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# ⭐ Azure OpenAI Configuration (FILL THESE IN)
AZURE_OPENAI_API_KEY=paste-your-api-key-here
AZURE_OPENAI_ENDPOINT=https://your-resource-name.openai.azure.com/
AZURE_OPENAI_API_VERSION=2024-02-15-preview
AZURE_CHAT_DEPLOYMENT=paste-your-deployment-name-here

# Service Configuration
AI_SERVICE_TIMEOUT=30
MODERATION_THRESHOLD=0.7
MAX_SIMILAR_HOTELS=10
```

**Save**: Press `Ctrl+O`, then `Enter`, then `Ctrl+X`

---

### Step 4: Verify Configuration ⏱️ 30 seconds

```bash
cd /Users/int1934/myCommunity/ai-service
python3 -c "from config import settings; print('✅ Endpoint:', settings.AZURE_OPENAI_ENDPOINT); print('✅ Deployment:', settings.AZURE_CHAT_DEPLOYMENT)"
```

**Expected output**:
```
✅ Endpoint: https://your-resource-name.openai.azure.com/
✅ Deployment: your-deployment-name
```

---

### Step 5: Restart AI Service ⏱️ 30 seconds

```bash
cd /Users/int1934/myCommunity/ai-service
python3 main.py
```

**Expected output** (in logs):
```
[AzureItineraryService] Initialized with deployment: your-deployment-name
```

---

### Step 6: Test Itinerary Generation ⏱️ 1 minute

1. Open your frontend (http://localhost:5173)
2. Go to a chat
3. Add some **activities** to cart
4. Add some **hotels** to cart
5. Click **"Generate Itinerary"**
6. Wait 5-10 seconds

**Expected result**: Beautiful, intelligent itinerary with selected hotels!

**Check logs** for:
```
[AzureItineraryService] Generating itinerary for 3 days...
[Azure OpenAI] Successfully generated 3 days as requested
```

---

## 🎉 Success Indicators

You'll know it's working when you see:

✅ **In Terminal Logs**:
```
[AzureItineraryService] Initialized with deployment: gpt-4-deployment
[Itinerary] Activities: 5, Hotels: 3, MyLens: 0
[AzureItineraryService] Generating itinerary for 3 days...
[AzureItineraryService] Successfully generated 3 days
[Azure OpenAI] Successfully generated 3 days as requested
```

✅ **In Frontend**:
- Itinerary displays with exactly the number of days requested
- Hotels are intelligently selected (not all hotels from cart)
- Activities are time-aware (beaches before 6 PM, parties after 9 PM)
- Each hotel has a "reason" explaining why it was selected

---

## ❌ Troubleshooting

### Issue: "API key not found"

**Cause**: `.env` file missing or incorrect location

**Fix**:
```bash
cd /Users/int1934/myCommunity/ai-service
ls -la .env  # Should show the file
cat .env | grep AZURE_OPENAI_API_KEY  # Should show your key
```

---

### Issue: "Deployment not found"

**Cause**: Deployment name doesn't match Azure Portal

**Fix**:
1. Go to Azure Portal → Your OpenAI Resource
2. Click "Model deployments"
3. Copy the **exact** deployment name
4. Update `.env` file with correct name

---

### Issue: Falls back to local LLM

**Logs show**:
```
[Fallback] Trying local LLM...
```

**Cause**: Azure OpenAI credentials are incorrect or service is down

**Fix**:
1. Verify API key is valid (not expired)
2. Check endpoint URL is correct (with trailing slash)
3. Ensure deployment name matches
4. Check Azure subscription is active
5. Test network connectivity

---

### Issue: Falls back to deterministic scheduler

**Logs show**:
```
[Scheduler] Using deterministic scheduler for 3 days
```

**Cause**: Both Azure OpenAI and local LLM failed

**Impact**: Itinerary will still be generated, but without AI reasoning

**Fix**:
1. Check Azure OpenAI setup (see above)
2. Verify local LLM is installed (if you want it as fallback)
3. Check logs for specific error messages

---

### Issue: Slow responses (>30 seconds)

**Cause**: Using GPT-4 which is slower than GPT-3.5

**Fix**: Use GPT-3.5-turbo deployment instead:
1. Create a GPT-3.5-turbo deployment in Azure
2. Update `AZURE_CHAT_DEPLOYMENT` in `.env`
3. Restart AI service

GPT-3.5 is 10x cheaper and 3x faster!

---

### Issue: High Azure costs

**Cause**: Many itinerary generations with GPT-4

**Fix**:
1. **Switch to GPT-3.5-turbo** (10x cheaper)
2. **Set spending limits** in Azure Portal
3. **Implement caching** for common itineraries
4. **Rate limit** per user (e.g., 5 itineraries per day)

---

## 📊 Cost Estimation

### GPT-4
- **Per itinerary**: ~$0.15
- **100 itineraries/day**: ~$15/day = $450/month

### GPT-3.5-turbo (Recommended for Dev)
- **Per itinerary**: ~$0.015
- **100 itineraries/day**: ~$1.50/day = $45/month

### Recommendation
- **Development**: Use GPT-3.5-turbo
- **Production**: Use GPT-4 for best quality, or GPT-3.5 for cost savings

---

## 🔒 Security Checklist

Before deploying to production:

- [ ] `.env` file is in `.gitignore`
- [ ] API keys are not committed to git
- [ ] Different keys for dev/staging/prod
- [ ] Spending limits set in Azure Portal
- [ ] Rate limiting implemented per user
- [ ] API key rotation schedule established
- [ ] Monitoring and alerts configured

---

## 📚 Additional Resources

- **Detailed Setup**: `ENV_SETUP_INSTRUCTIONS.md`
- **Integration Guide**: `AZURE_OPENAI_INTEGRATION.md`
- **Quick Start**: `AZURE_OPENAI_QUICKSTART.md`
- **Implementation Summary**: `AZURE_OPENAI_IMPLEMENTATION_SUMMARY.md`
- **Azure Portal**: https://portal.azure.com
- **Azure OpenAI Docs**: https://learn.microsoft.com/en-us/azure/ai-services/openai/

---

## 🚀 Automated Setup (Alternative)

Instead of manual setup, run the automated script:

```bash
cd /Users/int1934/myCommunity/ai-service
./setup_azure_openai.sh
```

Then just edit `.env` with your Azure credentials and restart!

---

## ✅ Final Checklist

Before considering setup complete:

- [ ] Dependencies installed (`openai` package)
- [ ] `.env` file created in `ai-service/` directory
- [ ] Azure credentials filled in `.env`
- [ ] Configuration verified (Step 4 above)
- [ ] AI service restarted
- [ ] Test itinerary generated successfully
- [ ] Logs show Azure OpenAI initialization
- [ ] Frontend displays intelligent itinerary
- [ ] Hotels are intelligently selected
- [ ] Time-aware scheduling works

---

**Need help?** Check the troubleshooting section above or review the detailed documentation files.

**Ready to test?** Generate your first intelligent itinerary! 🎉
