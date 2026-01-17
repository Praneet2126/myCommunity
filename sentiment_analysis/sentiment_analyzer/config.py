"""Configuration module for sentiment analyzer.

Handles model configuration and constants.
"""

# Model configuration
MODEL_NAME = "cardiffnlp/twitter-roberta-base-sentiment"

# Sentiment label mapping
# The model outputs: LABEL_0 (negative), LABEL_1 (neutral), LABEL_2 (positive)
SENTIMENT_LABELS = {
    0: "negative",
    1: "neutral",
    2: "positive"
}

# Device configuration (CPU-friendly)
USE_CPU = True  # Force CPU usage for local inference
