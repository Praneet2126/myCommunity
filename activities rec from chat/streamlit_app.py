import streamlit as st
import json
import requests
import pandas as pd

# Backend Configuration
BACKEND_URL = "http://localhost:8000"

st.set_page_config(page_title="Goa Trip Planner", layout="wide", page_icon="🏖️")

# Session State Initialization
if 'chat_id' not in st.session_state:
    st.session_state.chat_id = "session_" + str(pd.Timestamp.now().timestamp()).split('.')[0]
if 'messages' not in st.session_state:
    st.session_state.messages = []
if 'user_name' not in st.session_state:
    st.session_state.user_name = "User1"
if 'latest_recs' not in st.session_state:
    st.session_state.latest_recs = []

st.title("🏖️ Goa Trip Planner")
st.markdown("### Interactive Chat & Itinerary Builder")

# Sidebar: User Settings & Cart
st.sidebar.header("Settings & Cart")

# --- AUTO TEST BUTTONS ---
st.sidebar.subheader("🧪 Fast Test")
test_batches = {
    "Nature (7 msgs)": [
        "Let's see some crocodiles.",
        "I want to visit a bird sanctuary.",
        "Is there a nature trail nearby?",
        "I love mangroves and backwaters.",
        "Maybe a boat trip in the morning?",
        "Can we see some waterfalls?",
        "I want to visit a spice plantation."
    ],
    "Nightlife (7 msgs)": [
        "When do we hit the clubs?",
        "I want to go to Baga for parties.",
        "Is Tito's Lane still the best spot?",
        "Let's find a place with great music and dancing.",
        "Maybe a floating casino tonight?",
        "I heard Deltin Royale is the best casino.",
        "Let's go to a trance party in Anjuna."
    ]
}

for label, msgs in test_batches.items():
    if st.sidebar.button(f"Send {label}"):
        combined = "\n".join(msgs)
        st.session_state.messages.append({"role": "user", "user": st.session_state.user_name, "text": f"Batch: {label}"})
        try:
            resp = requests.post(f"{BACKEND_URL}/chat/message?chat_id={st.session_state.chat_id}&user={st.session_state.user_name}&message={combined}")
            if resp.status_code == 200:
                data = resp.json()
                if data.get("trigger_rec"):
                    st.session_state.latest_recs = data["recommendations"]
                    st.toast("New recommendations triggered!", icon="💡")
        except:
            st.sidebar.error("Backend offline.")
        st.rerun()

st.sidebar.divider()
st.session_state.user_name = st.sidebar.text_input("Your Name", st.session_state.user_name)
num_days = st.sidebar.number_input("Number of Days", min_value=1, max_value=14, value=3)
num_people = st.sidebar.number_input("Number of People", min_value=1, max_value=20, value=2)

if st.sidebar.button("Update Trip Settings"):
    try:
        resp = requests.post(f"{BACKEND_URL}/cart/update?chat_id={st.session_state.chat_id}&num_days={num_days}&num_people={num_people}")
        if resp.status_code == 200:
            st.sidebar.success("Settings Updated!")
    except:
        st.sidebar.error("Backend not reachable.")

# Sidebar: Cart View
st.sidebar.subheader("🛒 Shared Cart")
try:
    cart_resp = requests.get(f"{BACKEND_URL}/cart/{st.session_state.chat_id}")
    if cart_resp.status_code == 200:
        cart_data = cart_resp.json()
        if not cart_data['items']:
            st.sidebar.info("Cart is empty")
        for item in cart_data['items']:
            count_str = f" x{item['count']}" if item.get('count', 1) > 1 else ""
            st.sidebar.write(f"✅ {item['place_name']}{count_str} (by {item['added_by']})")
except:
    st.sidebar.error("Error fetching cart.")

if st.sidebar.button("✨ Generate Itinerary"):
    with st.spinner("Local AI is crafting your itinerary..."):
        try:
            resp = requests.post(f"{BACKEND_URL}/itinerary/generate?chat_id={st.session_state.chat_id}", timeout=180)
            if resp.status_code == 200:
                st.session_state.itinerary = resp.json()
                st.success("Itinerary Generated! Scroll down.")
            else:
                st.error(resp.json().get('detail', 'Error generating itinerary'))
        except:
            st.error("Backend error or timeout. Itinerary generation on CPU can take 1-2 minutes.")

# Main Layout: Chat and Results
col1, col2 = st.columns([2, 1])

with col1:
    st.subheader("Group Chat")
    # Display Chat
    chat_container = st.container()
    for m in st.session_state.messages:
        with chat_container.chat_message(m["role"]):
            st.write(f"**{m['user']}**: {m['text']}")

# Chat Input (must be at the top level, not in columns)
if prompt := st.chat_input("Talk about your Goa plans..."):
    st.session_state.messages.append({"role": "user", "user": st.session_state.user_name, "text": prompt})
    
    # Send to Backend
    try:
        resp = requests.post(f"{BACKEND_URL}/chat/message?chat_id={st.session_state.chat_id}&user={st.session_state.user_name}&message={prompt}")
        if resp.status_code == 200:
            data = resp.json()
            if data.get("trigger_rec"):
                st.session_state.latest_recs = data["recommendations"]
                st.toast("New recommendations triggered!", icon="💡")
    except:
        st.error("Backend is offline.")
    st.rerun()

with col2:
    st.subheader("Smart Recommendations")
    if st.session_state.latest_recs:
        st.caption("Based on your last 7 messages:")
        
        # Get current cart items for duplicate check
        current_items = {}
        try:
            cart_resp = requests.get(f"{BACKEND_URL}/cart/{st.session_state.chat_id}")
            if cart_resp.status_code == 200:
                current_items = {item['place_name']: item['count'] for item in cart_resp.json().get('items', [])}
        except:
            pass

        for res in st.session_state.latest_recs:
            with st.expander(f"📍 {res['name']}"):
                st.write(f"**Region:** {res['region']} | **Cat:** {res['category']}")
                st.write(f"**Time:** {res['duration']}")
                
                count = current_items.get(res['name'], 0)
                is_duplicate = count > 0
                
                if is_duplicate:
                    st.warning(f"In cart (x{count})")
                    if st.button(f"Add anyway?", key=f"confirm_{res['name']}"):
                        try:
                            resp = requests.post(f"{BACKEND_URL}/cart/add?chat_id={st.session_state.chat_id}&user={st.session_state.user_name}&place_name={res['name']}")
                            if resp.status_code == 200:
                                st.toast(f"Added {res['name']} again!")
                                st.rerun()
                            else:
                                st.error(resp.json().get('detail', "Error"))
                        except:
                            st.error("Backend offline.")
                else:
                    if st.button(f"Add to Cart", key=f"btn_{res['name']}"):
                        try:
                            resp = requests.post(f"{BACKEND_URL}/cart/add?chat_id={st.session_state.chat_id}&user={st.session_state.user_name}&place_name={res['name']}")
                            if resp.status_code == 200:
                                st.toast(f"Added {res['name']}!")
                                st.rerun()
                            else:
                                st.error(resp.json().get('detail', "Error"))
                        except:
                            st.error("Backend offline.")
    else:
        st.info("Chat more! Recommendations trigger every 15 messages.")

# Itinerary Display (if generated)
if 'itinerary' in st.session_state:
    st.divider()
    st.header("🗺️ Your Local AI Itinerary")
    itin = st.session_state.itinerary
    st.write(f"**Participants:** {itin['num_people']} | **Session:** {itin['chat_id']}")
    
    # Grid display for days
    cols = st.columns(min(len(itin['days']), 3))
    for i, day in enumerate(itin['days']):
        with cols[i % 3]:
            st.subheader(f"Day {day['day']}")
            st.caption(f"Total Activity + Travel: {day['total_duration_mins']} mins")
            if not day['activities']:
                st.write("_Free Day_")
            else:
                for act in day['activities']:
                    with st.container():
                        if act.get('travel_time_from_prev') and act['travel_time_from_prev'] != "0 mins":
                            st.caption(f"🚗 Travel: {act['travel_time_from_prev']}")
                        st.info(f"**{act['start_time']} - {act['end_time']}**\n\n**{act['name']}**\n\n{act['region']} | {act['duration']}")
