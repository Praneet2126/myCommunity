const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const BASE_URL = RAW_API_URL.replace(/\/api\/?$/, '');

export const saveItinerary = async (itineraryData, token) => {
  console.log('=== FRONTEND: Saving itinerary ===');
  console.log('API URL:', `${BASE_URL}/api/itineraries/save`);
  console.log('Itinerary data:', JSON.stringify(itineraryData, null, 2));
  console.log('Token present:', !!token);
  
  try {
    const response = await fetch(`${BASE_URL}/api/itineraries/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(itineraryData)
    });

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    
    const data = await response.json();
    console.log('Response data:', data);
    
    if (!response.ok) {
      console.error('Save itinerary error response:', data);
      // Extract error message from validation errors if present
      let errorMessage = data.message || 'Failed to save itinerary';
      if (data.errors && data.errors.length > 0) {
        errorMessage = data.errors.map(err => err.msg || err.message || JSON.stringify(err)).join(', ');
      }
      throw new Error(errorMessage);
    }

    console.log('Itinerary saved successfully!');
    return data;
  } catch (error) {
    console.error('Fetch error:', error);
    if (error.message) {
      throw error;
    }
    throw new Error('Network error: Failed to connect to server');
  }
};

export const getUserItineraries = async (token) => {
  const response = await fetch(`${BASE_URL}/api/itineraries`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch itineraries');
  }

  return response.json();
};

export const getItinerary = async (id, token) => {
  const response = await fetch(`${BASE_URL}/api/itineraries/${id}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch itinerary');
  }

  return response.json();
};

export const updateItinerary = async (id, itineraryData, token) => {
  const response = await fetch(`${BASE_URL}/api/itineraries/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(itineraryData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update itinerary');
  }

  return response.json();
};

export const deleteItinerary = async (id, token) => {
  const response = await fetch(`${BASE_URL}/api/itineraries/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete itinerary');
  }

  return response.json();
};
