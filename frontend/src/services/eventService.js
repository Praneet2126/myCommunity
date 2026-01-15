// City-specific dummy events
const EVENT_TEMPLATES = {
  mumbai: [
    { name: 'Mumbai Monsoon Festival', date: '2024-07-15', type: 'Cultural' },
    { name: 'Marine Drive Food Walk', date: '2024-07-20', type: 'Food' },
    { name: 'Bollywood Night', date: '2024-08-01', type: 'Entertainment' },
    { name: 'Gateway of India Heritage Tour', date: '2024-08-10', type: 'Tourism' },
    { name: 'Mumbai Street Art Festival', date: '2024-08-25', type: 'Art' }
  ],
  delhi: [
    { name: 'Red Fort Light Show', date: '2024-07-18', type: 'Cultural' },
    { name: 'Chandni Chowk Food Tour', date: '2024-07-22', type: 'Food' },
    { name: 'Qutub Minar Heritage Walk', date: '2024-08-05', type: 'Tourism' },
    { name: 'Delhi Literature Festival', date: '2024-08-15', type: 'Cultural' },
    { name: 'India Gate Evening Meetup', date: '2024-08-20', type: 'Social' }
  ],
  bangalore: [
    { name: 'Cubbon Park Morning Run', date: '2024-07-16', type: 'Fitness' },
    { name: 'Tech Meetup at Koramangala', date: '2024-07-25', type: 'Tech' },
    { name: 'Lalbagh Flower Show', date: '2024-08-08', type: 'Nature' },
    { name: 'Bangalore Food Festival', date: '2024-08-12', type: 'Food' },
    { name: 'Nandi Hills Sunrise Trek', date: '2024-08-28', type: 'Adventure' }
  ],
  kolkata: [
    { name: 'Durga Puja Preparations', date: '2024-07-20', type: 'Cultural' },
    { name: 'Howrah Bridge Heritage Walk', date: '2024-08-02', type: 'Tourism' },
    { name: 'Kolkata Book Fair', date: '2024-08-10', type: 'Cultural' },
    { name: 'Park Street Food Crawl', date: '2024-08-18', type: 'Food' },
    { name: 'Victoria Memorial Photography', date: '2024-08-22', type: 'Art' }
  ],
  chennai: [
    { name: 'Marina Beach Sunrise', date: '2024-07-17', type: 'Nature' },
    { name: 'Temple Tour - Kapaleeshwarar', date: '2024-07-28', type: 'Cultural' },
    { name: 'Chennai Music Festival', date: '2024-08-05', type: 'Entertainment' },
    { name: 'South Indian Food Festival', date: '2024-08-14', type: 'Food' },
    { name: 'Mahabalipuram Day Trip', date: '2024-08-25', type: 'Tourism' }
  ],
  hyderabad: [
    { name: 'Charminar Heritage Walk', date: '2024-07-19', type: 'Tourism' },
    { name: 'Hyderabadi Biryani Festival', date: '2024-07-26', type: 'Food' },
    { name: 'Golconda Fort Tour', date: '2024-08-06', type: 'Tourism' },
    { name: 'IT Hub Networking Event', date: '2024-08-13', type: 'Tech' },
    { name: 'Hussain Sagar Lake Boating', date: '2024-08-21', type: 'Recreation' }
  ],
  pune: [
    { name: 'Osho Ashram Meditation', date: '2024-07-21', type: 'Wellness' },
    { name: 'Shaniwar Wada Heritage Tour', date: '2024-07-30', type: 'Tourism' },
    { name: 'Pune Tech Summit', date: '2024-08-07', type: 'Tech' },
    { name: 'Lonavala Weekend Trip', date: '2024-08-16', type: 'Adventure' },
    { name: 'Pune Food Walk', date: '2024-08-23', type: 'Food' }
  ],
  jaipur: [
    { name: 'Hawa Mahal Photography', date: '2024-07-23', type: 'Art' },
    { name: 'City Palace Heritage Tour', date: '2024-08-01', type: 'Tourism' },
    { name: 'Rajasthani Culture Festival', date: '2024-08-09', type: 'Cultural' },
    { name: 'Amber Fort Visit', date: '2024-08-17', type: 'Tourism' },
    { name: 'Jaipur Literature Festival Prep', date: '2024-08-24', type: 'Cultural' }
  ],
  goa: [
    { name: 'Beach Cleanup Drive', date: '2024-07-24', type: 'Social' },
    { name: 'Goa Music Festival', date: '2024-08-03', type: 'Entertainment' },
    { name: 'Sunset at Baga Beach', date: '2024-08-11', type: 'Recreation' },
    { name: 'Goan Food Festival', date: '2024-08-19', type: 'Food' },
    { name: 'Dudhsagar Falls Trek', date: '2024-08-26', type: 'Adventure' }
  ],
  ahmedabad: [
    { name: 'Sabarmati Ashram Visit', date: '2024-07-27', type: 'Cultural' },
    { name: 'Gujarati Thali Festival', date: '2024-08-04', type: 'Food' },
    { name: 'Rann of Kutch Trip', date: '2024-08-15', type: 'Tourism' },
    { name: 'Navratri Preparations', date: '2024-08-20', type: 'Cultural' },
    { name: 'Ahmedabad Heritage Walk', date: '2024-08-27', type: 'Tourism' }
  ]
};

/**
 * Get events for a specific city
 * @param {string} cityId - City ID
 * @returns {Array} Array of event objects
 */
export const getEventsByCity = (cityId) => {
  const normalizedId = cityId.toLowerCase();
  return EVENT_TEMPLATES[normalizedId] || [];
};

/**
 * Get events for current month and next month
 * @param {string} cityId - City ID
 * @returns {Array} Array of event objects
 */
export const getUpcomingEvents = (cityId) => {
  const events = getEventsByCity(cityId);
  const today = new Date();
  const twoMonthsLater = new Date(today);
  twoMonthsLater.setMonth(twoMonthsLater.getMonth() + 2);
  
  return events.filter(event => {
    const eventDate = new Date(event.date);
    return eventDate >= today && eventDate <= twoMonthsLater;
  }).sort((a, b) => new Date(a.date) - new Date(b.date));
};

/**
 * Get event by date
 * @param {string} cityId - City ID
 * @param {string} date - Date string (YYYY-MM-DD)
 * @returns {Array} Array of events on that date
 */
export const getEventsByDate = (cityId, date) => {
  const events = getEventsByCity(cityId);
  return events.filter(event => event.date === date);
};
