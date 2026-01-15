// City-specific dummy events
const EVENT_TEMPLATES = {
  mumbai: [
    { name: 'Mumbai New Year Celebration', date: '2026-01-01', type: 'Cultural' },
    { name: 'Marine Drive Food Walk', date: '2026-01-05', type: 'Food' },
    { name: 'Bollywood Night', date: '2026-01-10', type: 'Entertainment' },
    { name: 'Gateway of India Heritage Tour', date: '2026-01-15', type: 'Tourism' },
    { name: 'Mumbai Street Art Festival', date: '2026-01-20', type: 'Art' },
    { name: 'Elephanta Caves Day Trip', date: '2026-01-06', type: 'Tourism' },
    { name: 'Colaba Causeway Shopping', date: '2026-01-11', type: 'Social' },
    { name: 'Mumbai Marathon Training', date: '2026-01-16', type: 'Fitness' },
    { name: 'Juhu Beach Sunset', date: '2026-01-22', type: 'Recreation' },
    { name: 'Mumbai Startup Meetup', date: '2026-01-27', type: 'Tech' },
    { name: 'Mumbai Film Festival', date: '2026-01-08', type: 'Entertainment' },
    { name: 'Dharavi Slum Tour', date: '2026-01-13', type: 'Tourism' },
    { name: 'Mumbai Night Market', date: '2026-01-18', type: 'Food' },
    { name: 'Mumbai Art Gallery Walk', date: '2026-01-24', type: 'Art' },
    { name: 'Mumbai Tech Conference', date: '2026-01-29', type: 'Tech' },
    { name: 'Mumbai Monsoon Festival', date: '2024-07-15', type: 'Cultural' },
    { name: 'Marine Drive Food Walk', date: '2024-07-20', type: 'Food' },
    { name: 'Bollywood Night', date: '2024-08-01', type: 'Entertainment' },
    { name: 'Gateway of India Heritage Tour', date: '2024-08-10', type: 'Tourism' },
    { name: 'Mumbai Street Art Festival', date: '2024-08-25', type: 'Art' }
  ],
  delhi: [
    { name: 'Republic Day Parade Viewing', date: '2026-01-26', type: 'Cultural' },
    { name: 'Red Fort Light Show', date: '2026-01-08', type: 'Cultural' },
    { name: 'Chandni Chowk Food Tour', date: '2026-01-12', type: 'Food' },
    { name: 'Qutub Minar Heritage Walk', date: '2026-01-18', type: 'Tourism' },
    { name: 'India Gate Evening Meetup', date: '2026-01-25', type: 'Social' },
    { name: 'Lotus Temple Meditation', date: '2026-01-02', type: 'Wellness' },
    { name: 'Delhi Book Fair', date: '2026-01-09', type: 'Cultural' },
    { name: 'Connaught Place Heritage Walk', date: '2026-01-13', type: 'Tourism' },
    { name: 'Delhi Food Festival', date: '2026-01-19', type: 'Food' },
    { name: 'Akshardham Temple Visit', date: '2026-01-24', type: 'Cultural' },
    { name: 'Delhi Photography Walk', date: '2026-01-30', type: 'Art' },
    { name: 'Red Fort Light Show', date: '2024-07-18', type: 'Cultural' },
    { name: 'Chandni Chowk Food Tour', date: '2024-07-22', type: 'Food' },
    { name: 'Qutub Minar Heritage Walk', date: '2024-08-05', type: 'Tourism' },
    { name: 'Delhi Literature Festival', date: '2024-08-15', type: 'Cultural' },
    { name: 'India Gate Evening Meetup', date: '2024-08-20', type: 'Social' }
  ],
  bangalore: [
    { name: 'Cubbon Park Morning Run', date: '2026-01-03', type: 'Fitness' },
    { name: 'Tech Meetup at Koramangala', date: '2026-01-07', type: 'Tech' },
    { name: 'Lalbagh Flower Show', date: '2026-01-14', type: 'Nature' },
    { name: 'Bangalore Food Festival', date: '2026-01-19', type: 'Food' },
    { name: 'Nandi Hills Sunrise Trek', date: '2026-01-28', type: 'Adventure' },
    { name: 'Bangalore Startup Weekend', date: '2026-01-04', type: 'Tech' },
    { name: 'Ulsoor Lake Boating', date: '2026-01-09', type: 'Recreation' },
    { name: 'Bangalore Heritage Walk', date: '2026-01-15', type: 'Tourism' },
    { name: 'MG Road Shopping Spree', date: '2026-01-21', type: 'Social' },
    { name: 'Bangalore Music Night', date: '2026-01-29', type: 'Entertainment' },
    { name: 'Cubbon Park Morning Run', date: '2024-07-16', type: 'Fitness' },
    { name: 'Tech Meetup at Koramangala', date: '2024-07-25', type: 'Tech' },
    { name: 'Lalbagh Flower Show', date: '2024-08-08', type: 'Nature' },
    { name: 'Bangalore Food Festival', date: '2024-08-12', type: 'Food' },
    { name: 'Nandi Hills Sunrise Trek', date: '2024-08-28', type: 'Adventure' }
  ],
  kolkata: [
    { name: 'Kolkata New Year Celebration', date: '2026-01-01', type: 'Cultural' },
    { name: 'Howrah Bridge Heritage Walk', date: '2026-01-04', type: 'Tourism' },
    { name: 'Kolkata Book Fair', date: '2026-01-08', type: 'Cultural' },
    { name: 'Park Street Food Crawl', date: '2026-01-12', type: 'Food' },
    { name: 'Victoria Memorial Photography', date: '2026-01-16', type: 'Art' },
    { name: 'Dakshineswar Kali Temple Visit', date: '2026-01-06', type: 'Cultural' },
    { name: 'Kolkata Street Art Tour', date: '2026-01-11', type: 'Art' },
    { name: 'Science City Exploration', date: '2026-01-17', type: 'Social' },
    { name: 'Kolkata Literature Festival', date: '2026-01-23', type: 'Cultural' },
    { name: 'Sunderbans Day Trip', date: '2026-01-30', type: 'Nature' },
    { name: 'Durga Puja Preparations', date: '2024-07-20', type: 'Cultural' },
    { name: 'Howrah Bridge Heritage Walk', date: '2024-08-02', type: 'Tourism' },
    { name: 'Kolkata Book Fair', date: '2024-08-10', type: 'Cultural' },
    { name: 'Park Street Food Crawl', date: '2024-08-18', type: 'Food' },
    { name: 'Victoria Memorial Photography', date: '2024-08-22', type: 'Art' }
  ],
  chennai: [
    { name: 'Marina Beach Sunrise', date: '2026-01-02', type: 'Nature' },
    { name: 'Temple Tour - Kapaleeshwarar', date: '2026-01-07', type: 'Cultural' },
    { name: 'Chennai Music Festival', date: '2026-01-13', type: 'Entertainment' },
    { name: 'South Indian Food Festival', date: '2026-01-18', type: 'Food' },
    { name: 'Mahabalipuram Day Trip', date: '2026-01-24', type: 'Tourism' },
    { name: 'Pongal Celebration', date: '2026-01-14', type: 'Cultural' },
    { name: 'Chennai Heritage Walk', date: '2026-01-09', type: 'Tourism' },
    { name: 'Besant Nagar Beach Cleanup', date: '2026-01-20', type: 'Social' },
    { name: 'Chennai Film Festival', date: '2026-01-27', type: 'Entertainment' },
    { name: 'Marina Beach Sunrise', date: '2024-07-17', type: 'Nature' },
    { name: 'Temple Tour - Kapaleeshwarar', date: '2024-07-28', type: 'Cultural' },
    { name: 'Chennai Music Festival', date: '2024-08-05', type: 'Entertainment' },
    { name: 'South Indian Food Festival', date: '2024-08-14', type: 'Food' },
    { name: 'Mahabalipuram Day Trip', date: '2024-08-25', type: 'Tourism' }
  ],
  hyderabad: [
    { name: 'Charminar Heritage Walk', date: '2026-01-05', type: 'Tourism' },
    { name: 'Hyderabadi Biryani Festival', date: '2026-01-10', type: 'Food' },
    { name: 'Golconda Fort Tour', date: '2026-01-15', type: 'Tourism' },
    { name: 'IT Hub Networking Event', date: '2026-01-20', type: 'Tech' },
    { name: 'Hussain Sagar Lake Boating', date: '2026-01-25', type: 'Recreation' },
    { name: 'Ramoji Film City Tour', date: '2026-01-08', type: 'Entertainment' },
    { name: 'Hyderabad Photography Walk', date: '2026-01-14', type: 'Art' },
    { name: 'Salar Jung Museum Visit', date: '2026-01-19', type: 'Cultural' },
    { name: 'Hyderabad Startup Meetup', date: '2026-01-26', type: 'Tech' },
    { name: 'Charminar Heritage Walk', date: '2024-07-19', type: 'Tourism' },
    { name: 'Hyderabadi Biryani Festival', date: '2024-07-26', type: 'Food' },
    { name: 'Golconda Fort Tour', date: '2024-08-06', type: 'Tourism' },
    { name: 'IT Hub Networking Event', date: '2024-08-13', type: 'Tech' },
    { name: 'Hussain Sagar Lake Boating', date: '2024-08-21', type: 'Recreation' }
  ],
  pune: [
    { name: 'Osho Ashram Meditation', date: '2026-01-03', type: 'Wellness' },
    { name: 'Shaniwar Wada Heritage Tour', date: '2026-01-08', type: 'Tourism' },
    { name: 'Pune Tech Summit', date: '2026-01-14', type: 'Tech' },
    { name: 'Lonavala Weekend Trip', date: '2026-01-19', type: 'Adventure' },
    { name: 'Pune Food Walk', date: '2026-01-24', type: 'Food' },
    { name: 'Aga Khan Palace Visit', date: '2026-01-06', type: 'Cultural' },
    { name: 'Pune Cycling Tour', date: '2026-01-11', type: 'Fitness' },
    { name: 'Koregaon Park Food Festival', date: '2026-01-17', type: 'Food' },
    { name: 'Pune Literature Festival', date: '2026-01-22', type: 'Cultural' },
    { name: 'Sinhagad Fort Trek', date: '2026-01-29', type: 'Adventure' },
    { name: 'Osho Ashram Meditation', date: '2024-07-21', type: 'Wellness' },
    { name: 'Shaniwar Wada Heritage Tour', date: '2024-07-30', type: 'Tourism' },
    { name: 'Pune Tech Summit', date: '2024-08-07', type: 'Tech' },
    { name: 'Lonavala Weekend Trip', date: '2024-08-16', type: 'Adventure' },
    { name: 'Pune Food Walk', date: '2024-08-23', type: 'Food' }
  ],
  jaipur: [
    { name: 'Hawa Mahal Photography', date: '2026-01-04', type: 'Art' },
    { name: 'City Palace Heritage Tour', date: '2026-01-09', type: 'Tourism' },
    { name: 'Rajasthani Culture Festival', date: '2026-01-15', type: 'Cultural' },
    { name: 'Amber Fort Visit', date: '2026-01-21', type: 'Tourism' },
    { name: 'Jaipur Literature Festival', date: '2026-01-23', type: 'Cultural' },
    { name: 'Jantar Mantar Observatory Tour', date: '2026-01-07', type: 'Tourism' },
    { name: 'Jaipur Food Walk', date: '2026-01-12', type: 'Food' },
    { name: 'Rajasthani Folk Music Night', date: '2026-01-18', type: 'Entertainment' },
    { name: 'Nahargarh Fort Sunset', date: '2026-01-25', type: 'Recreation' },
    { name: 'Jaipur Shopping Spree', date: '2026-01-28', type: 'Social' },
    { name: 'Hawa Mahal Photography', date: '2024-07-23', type: 'Art' },
    { name: 'City Palace Heritage Tour', date: '2024-08-01', type: 'Tourism' },
    { name: 'Rajasthani Culture Festival', date: '2024-08-09', type: 'Cultural' },
    { name: 'Amber Fort Visit', date: '2024-08-17', type: 'Tourism' },
    { name: 'Jaipur Literature Festival Prep', date: '2024-08-24', type: 'Cultural' }
  ],
  goa: [
    { name: 'Goa New Year Beach Party', date: '2026-01-01', type: 'Entertainment' },
    { name: 'Beach Cleanup Drive', date: '2026-01-06', type: 'Social' },
    { name: 'Goa Music Festival', date: '2026-01-11', type: 'Entertainment' },
    { name: 'Sunset at Baga Beach', date: '2026-01-16', type: 'Recreation' },
    { name: 'Goan Food Festival', date: '2026-01-21', type: 'Food' },
    { name: 'Dudhsagar Falls Trek', date: '2026-01-26', type: 'Adventure' },
    { name: 'Old Goa Heritage Tour', date: '2026-01-05', type: 'Tourism' },
    { name: 'Goa Water Sports', date: '2026-01-10', type: 'Adventure' },
    { name: 'Goa Photography Walk', date: '2026-01-17', type: 'Art' },
    { name: 'Goa Yoga Retreat', date: '2026-01-24', type: 'Wellness' },
    { name: 'Beach Cleanup Drive', date: '2024-07-24', type: 'Social' },
    { name: 'Goa Music Festival', date: '2024-08-03', type: 'Entertainment' },
    { name: 'Sunset at Baga Beach', date: '2024-08-11', type: 'Recreation' },
    { name: 'Goan Food Festival', date: '2024-08-19', type: 'Food' },
    { name: 'Dudhsagar Falls Trek', date: '2024-08-26', type: 'Adventure' }
  ],
  ahmedabad: [
    { name: 'Sabarmati Ashram Visit', date: '2026-01-03', type: 'Cultural' },
    { name: 'Gujarati Thali Festival', date: '2026-01-08', type: 'Food' },
    { name: 'Rann of Kutch Trip', date: '2026-01-13', type: 'Tourism' },
    { name: 'Uttarayan Kite Festival', date: '2026-01-14', type: 'Cultural' },
    { name: 'Ahmedabad Heritage Walk', date: '2026-01-19', type: 'Tourism' },
    { name: 'Adalaj Stepwell Visit', date: '2026-01-05', type: 'Tourism' },
    { name: 'Ahmedabad Food Walk', date: '2026-01-11', type: 'Food' },
    { name: 'Gujarat Science City', date: '2026-01-17', type: 'Social' },
    { name: 'Ahmedabad Photography Tour', date: '2026-01-22', type: 'Art' },
    { name: 'Sabarmati Riverfront Walk', date: '2026-01-28', type: 'Recreation' },
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
 * @param {string} cityId - City ID (null for all cities)
 * @param {string} date - Date string (YYYY-MM-DD)
 * @returns {Array} Array of events on that date
 */
export const getEventsByDate = (cityId, date) => {
  if (cityId === null) {
    // Get from all cities
    const allEvents = getAllEvents();
    return allEvents.filter(event => event.date === date);
  }
  const events = getEventsByCity(cityId);
  return events.filter(event => event.date === date);
};

/**
 * Get all events from all cities
 * @returns {Array} Array of all event objects
 */
export const getAllEvents = () => {
  let allEvents = [];
  for (const cityId in EVENT_TEMPLATES) {
    allEvents = allEvents.concat(EVENT_TEMPLATES[cityId]);
  }
  return allEvents;
};

/**
 * Get events for a specific month (from all cities or a specific city)
 * @param {number} year - Year
 * @param {number} month - Month (0-11)
 * @param {string|null} cityId - City ID (optional, null for all cities)
 * @returns {Array} Array of event objects
 */
export const getEventsByMonth = (year, month, cityId = null) => {
  let events;
  if (cityId) {
    // Get events for specific city
    events = getEventsByCity(cityId);
  } else {
    // Get events from all cities
    events = getAllEvents();
  }
  
  return events.filter(event => {
    const eventDate = new Date(event.date);
    return eventDate.getFullYear() === year && eventDate.getMonth() === month;
  });
};
