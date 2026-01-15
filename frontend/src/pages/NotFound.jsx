import { Link } from 'react-router-dom';

/**
 * NotFound component
 * 404 page with navigation back home
 */
function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center px-4">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-[#FF6B35]">404</h1>
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
          Page Not Found
        </h2>
        <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
          Oops! The page you're looking for doesn't exist. It might have been moved or deleted.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="bg-[#FF6B35] text-white px-8 py-3 rounded-full font-semibold hover:bg-[#E55A2B] transition-colors inline-block"
          >
            Go to Homepage
          </Link>
          <Link
            to="/"
            className="bg-white border-2 border-[#FF6B35] text-[#FF6B35] px-8 py-3 rounded-full font-semibold hover:bg-orange-50 transition-colors inline-block"
          >
            Explore Cities
          </Link>
        </div>
      </div>
    </div>
  );
}

export default NotFound;
