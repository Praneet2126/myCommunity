import { Link } from 'react-router-dom';
import { APP_NAME } from '../../utils/constants';

/**
 * Footer component
 * MakeMyTrip-inspired footer design
 */
function Footer() {
  return (
    <footer className="bg-gray-800 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="bg-[#FF6B35] text-white px-3 py-1.5 rounded-lg font-bold text-xl">
                C
              </div>
              <span className="text-xl font-bold">{APP_NAME}</span>
            </div>
            <p className="text-gray-400 text-sm">
              Connect with travelers and locals in your favorite Indian cities.
              Explore, chat, and discover amazing events.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/"
                  className="text-gray-400 hover:text-[#FF6B35] transition-colors text-sm"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/cities"
                  className="text-gray-400 hover:text-[#FF6B35] transition-colors text-sm"
                >
                  Explore Cities
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-[#FF6B35] transition-colors text-sm"
                >
                  Help Center
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-[#FF6B35] transition-colors text-sm"
                >
                  Contact Us
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>&copy; 2024 {APP_NAME}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
