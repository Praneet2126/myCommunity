# Image Search Architecture

## Overview
This module provides a high-fidelity hybrid visual search engine for hotels. It allows users to upload an image (even blurry or low-quality) and find the most visually similar hotels in the database.

## Components
1. **Semantic Search (CLIP)**: Uses OpenAI's `ViT-L/14@336px` to understand the content and "vibe" of the image.
2. **Color/Texture Search**: A custom histogram-based matching system that looks at the exact pixel distribution and structural patterns.
3. **Hybrid Fusion**: Combines AI intelligence (70%) with pixel-perfect matching (30%) for maximum accuracy.
4. **Database**: SQLite stores hotel metadata (stars, price, description).

## Tech Stack
- **Python 3.11+**
- **CLIP (OpenAI)**
- **PyTorch**
- **NumPy & OpenCV**
- **Streamlit** (for the UI)

## For Backend Developers
### Input
- **Endpoint**: `/` (Streamlit file uploader)
- **Data**: Binary image data (PNG, JPG, JPEG, WebP).
- **Processing**: The image is enhanced using a sharpening filter and autocontrast before encoding.

### Output
- **Format**: List of hotel records with similarity scores.
- **Fields**: `hotel_id`, `score`, `name`, `stars`, `price`, `description`, `image_path`.

## For Frontend Developers
- **Interaction**: Provide a file drop-zone. Use `use_container_width=True` for responsive image rendering.
- **Display**: Show the matched hotel name and its visual score (0.0 to 1.0).

## Files
- `app.py`: Main application logic.
- `hotel_features_ai.npy`: Pre-computed CLIP embeddings.
- `hotel_features_color.npy`: Pre-computed color histograms.
- `mapping.pkl`: Mapping between embedding indices and hotel IDs.
- `hotels.db`: Metadata database.
