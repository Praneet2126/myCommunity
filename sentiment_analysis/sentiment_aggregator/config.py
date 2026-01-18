"""Configuration for sentiment aggregation.

Defines thresholds and scoring parameters.
"""

# Minimum number of messages required for a tag to be included in aggregation
MIN_MESSAGE_THRESHOLD = 10

# Score thresholds for label assignment
POSITIVE_THRESHOLD = 0.3
NEGATIVE_THRESHOLD = -0.3

# Sentiment weights for scoring
SENTIMENT_WEIGHTS = {
    'positive': 1,
    'neutral': 0,
    'negative': -1
}
