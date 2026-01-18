"""Configuration module for message tagger.

Contains curated keyword lists for Places, Hotels, and Themes.
"""

# Place keywords (beaches, landmarks, cities, tourist spots)
PLACE_KEYWORDS = {
    # Beaches
    "baga beach", "calangute beach", "anjuna beach", "vagator beach", "benaulim beach",
    "colva beach", "palolem beach", "agonda beach", "morjim beach", "ashwem beach",
    "candolim beach", "betalbatim beach", "majorda beach", "varca beach", "cavelossim beach",
    "arambol beach", "keri beach", "galgibaga beach", "patnem beach", "butterfly beach",
    
    # Indian Cities/Locations
    "mumbai", "delhi", "bangalore", "goa", "kerala", "rajasthan", "himachal",
    "manali", "shimla", "darjeeling", "ooty", "munnar", "alleppey", "kodaikanal",
    "jaipur", "udaipur", "jodhpur", "jaisalmer", "pushkar", "ajmer", "mount abu",
    "varanasi", "rishikesh", "haridwar", "dehradun", "mussoorie", "nainital",
    "kolkata", "chennai", "hyderabad", "pune", "ahmedabad", "surat", "vadodara",
    "lucknow", "kanpur", "agra", "mathura", "vrindavan", "amritsar", "chandigarh",
    
    # Landmarks & Tourist Spots
    "taj mahal", "red fort", "qutub minar", "india gate", "gateway of india",
    "hawa mahal", "city palace", "lake palace", "golden temple", "lotus temple",
    "charminar", "victoria memorial", "howrah bridge", "marine drive", "juhu beach",
    "marine lines", "bandra", "colaba", "fort", "churchgate", "andheri", "powai",
    
    # International (common travel destinations)
    "paris", "london", "new york", "tokyo", "bangkok", "singapore", "dubai",
    "bali", "phuket", "krabi", "pattaya", "kuala lumpur", "hong kong",
    "sydney", "melbourne", "gold coast", "queensland", "cairns",
    "amsterdam", "barcelona", "rome", "venice", "florence", "santorini", "mykonos",
    "istanbul", "cairo", "marrakech", "cape town", "rio de janeiro",
}

# Hotel keywords (hotel chains and common hotel names)
HOTEL_KEYWORDS = {
    # International Chains
    "marriott", "hilton", "hyatt", "sheraton", "westin", "radisson", "holiday inn",
    "intercontinental", "crown plaza", "ramada", "novotel", "mercure", "ibis",
    "accor", "taj", "oberoi", "leela", "itc", "trident", "vivanta", "ginger",
    "lemontree", "treebo", "oyo", "fabhotels", "redfox", "snowfox",
    
    # Luxury Brands
    "ritz carlton", "four seasons", "st regis", "w hotel", "conrad", "park hyatt",
    "grand hyatt", "peninsula", "mandarin oriental", "shangri la", "fairmont",
    "raffles", "kempinski", "sofitel", "pullman", "swissotel",
    
    # Boutique & Resort Brands
    "taj exotica", "taj lands end", "taj mahal palace", "oberoi udaivilas",
    "oberoi amarvilas", "leela palace", "leela kempinski", "itc maurya",
    "itc maratha", "itc grand chola", "itc sonar", "itc kohenur",
    
    # Budget Chains
    "oyo rooms", "oyo hotel", "treebo", "fabhotels", "redfox hotels",
    "snowfox hotels", "ginger hotels", "ibis budget", "formule 1",
    
    # Common Hotel Terms (partial match helpers)
    "resort", "hotel", "lodge", "inn", "villa", "cottage", "guesthouse",
}

# Theme keywords (activities, interests, topics)
THEME_KEYWORDS = {
    # Activities
    "adventure", "hiking", "trekking", "camping", "backpacking", "safari", "wildlife",
    "scuba diving", "snorkeling", "surfing", "parasailing", "jet skiing", "water sports",
    "beach", "swimming", "sunbathing", "beach volleyball", "beach party",
    "sightseeing", "tours", "exploring", "walking tour", "city tour",
    "shopping", "markets", "bazaars", "souvenirs", "local shopping",
    "nightlife", "clubs", "bars", "pubs", "night clubs", "dancing", "party",
    "music", "live music", "concerts", "festivals", "cultural events",
    
    # Interests
    "photography", "nature photography", "wildlife photography", "landscape",
    "architecture", "historical", "heritage", "culture", "traditions",
    "food", "cuisine", "local food", "street food", "restaurants", "dining",
    "spa", "wellness", "yoga", "meditation", "relaxation", "massage",
    "sports", "cricket", "football", "golf", "tennis", "cycling",
    
    # Demographics/Context
    "family", "families", "family friendly", "kids", "children", "child friendly",
    "couples", "romantic", "honeymoon", "wedding", "anniversary",
    "solo", "solo travel", "backpackers", "budget", "luxury", "premium",
    "business", "corporate", "meetings", "conferences",
    
    # Atmosphere/Mood
    "peaceful", "quiet", "serene", "tranquil", "calm", "relaxing",
    "vibrant", "lively", "busy", "crowd", "crowded", "popular", "touristy",
    "offbeat", "hidden gem", "local", "authentic", "traditional",
    
    # Time-based
    "sunrise", "sunset", "morning", "evening", "night", "day trip",
    "weekend", "weekend getaway", "vacation", "holiday",
    
    # Specific Themes
    "beach holiday", "mountain", "hills", "hill station", "valley",
    "desert", "jungle", "forest", "national park", "sanctuary",
    "temple", "religious", "pilgrimage", "spiritual",
    "art", "museums", "galleries", "theater", "performing arts",
}
