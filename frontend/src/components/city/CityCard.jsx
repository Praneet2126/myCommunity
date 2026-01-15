import { Link } from 'react-router-dom';

/**
 * CityCard component
 * Displays city information in a card format
 * @param {Object} props - Component props
 * @param {Object} props.city - City object with id, name, description, image
 */
function CityCard({ city }) {
  return (
    <Link
      to={`/city/${city.name || city.id || city._id}`}
      className="group relative overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
    >
      {/* City Image */}
      <div className="relative h-64 overflow-hidden">
        <img
          src={city.image}
          alt={city.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        
        {/* City Name */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <h3 className="text-2xl font-bold text-white mb-1">{city.displayName}</h3>
          <p className="text-white/90 text-sm line-clamp-2">{city.description}</p>
        </div>
      </div>

      {/* Card Footer */}
      <div className="bg-white p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">{city.tagline}</span>
          <div className="flex items-center text-[#FF6B35] font-semibold group-hover:text-[#E55A2B] transition-colors">
            <span className="text-sm mr-1">Explore</span>
            <svg
              className="w-4 h-4 transform group-hover:translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default CityCard;
