import { useCity } from '../context/CityContext';
import CityCard from '../components/city/CityCard';
import { APP_TAGLINE } from '../utils/constants';

function HomePage() {
  const { cities, loading } = useCity();

  return (
    <div className="min-h-screen bg-white">
      {/* HERO SECTION */}
      <div className="relative text-white overflow-hidden">
        {/* Background Image - Maximum clarity */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=95&auto=format&fit=crop)',
            opacity: 1,
            filter: 'brightness(1.15) contrast(1.1) saturate(1.1)'
          }}
        />
        {/* Blue Gradient Overlay - Minimal opacity to preserve image clarity */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1E40AF]/40 via-[#2563EB]/35 to-[#3B82F6]/30" />
        {/* Very subtle overlay for text readability */}
        <div className="absolute inset-0 bg-black/5" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">

          {/* HERO CONTENT */}
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur px-4 py-2 rounded-full mb-6 border border-white/30">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              <span className="text-sm font-medium">India's Travel Community</span>
            </div>

            {/* Heading */}
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
              Discover, Chat & Travel
              <span className="block text-red-400 mt-2">Across Indian Cities</span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-xl text-blue-100 mt-4 mb-10">
              {APP_TAGLINE}
            </p>

            {/* SEARCH BAR */}
            <div className="bg-white rounded-2xl shadow-2xl p-3 flex flex-col md:flex-row items-center gap-3 max-w-4xl mx-auto">
              <div className="flex items-center gap-3 w-full px-4">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 21l-4.35-4.35m1.85-5.65a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search cities, places, events or chats"
                  className="w-full py-4 text-gray-700 focus:outline-none text-lg"
                />
              </div>
              <button className="bg-red-500 hover:bg-red-600 text-white px-8 py-4 rounded-xl font-bold text-lg w-full md:w-auto">
                Search
              </button>
            </div>
          </div>

          {/* FEATURES INSIDE HERO */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/90 backdrop-blur rounded-4xl p-6 text-center shadow-xl">
              <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-800 text-lg mb-1">City Chats</h3>
              <p className="text-gray-600 text-sm">Talk with locals & travelers instantly</p>
            </div>

            <div className="bg-white/90 backdrop-blur rounded-2xl p-6 text-center shadow-xl">
              <div className="w-14 h-14 bg-red-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-800 text-lg mb-1">Events & Meetups</h3>
              <p className="text-gray-600 text-sm">Festivals, plans & city activities</p>
            </div>

            <div className="bg-white/90 backdrop-blur rounded-2xl p-6 text-center shadow-xl">
              <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-800 text-lg mb-1">Explore Cities</h3>
              <p className="text-gray-600 text-sm">Hidden gems & top destinations</p>
            </div>
          </div>
        </div>

        {/* WAVE */}
        <svg viewBox="0 0 1440 120" className="absolute bottom-0 w-full">
          <path fill="white" d="M0,120L80,105C160,90,320,60,480,55C640,50,800,70,960,75C1120,80,1280,70,1360,65L1440,60V120Z" />
        </svg>
      </div>

      {/* CITIES GRID */}
      <div id="cities" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-14">
          <span className="text-red-500 font-bold uppercase text-sm">Popular Cities</span>
          <h2 className="text-4xl font-extrabold text-gray-900 mt-2">
            Explore India’s Top Destinations
          </h2>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {cities.map(city => (
              <CityCard key={city.id} city={city} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default HomePage;
