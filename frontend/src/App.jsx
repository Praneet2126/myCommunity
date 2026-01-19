import { useLayoutEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CityProvider } from './context/CityContext';
import { ChatProvider } from './context/ChatContext';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import CityPage from './pages/CityPage';
import CitiesPage from './pages/CitiesPage';
import EventsPage from './pages/EventsPage';
import ChatPage from './pages/ChatPage';
import ProfilePage from './pages/ProfilePage';
import NotFound from './pages/NotFound';
import MylensPage from './pages/MylensPage';

/**
 * ScrollToTop component
 * Scrolls to top of page on route change
 */
function ScrollToTop() {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    // Scroll to top using multiple methods for cross-browser compatibility
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname]);

  return null;
}

/**
 * App component
 * Main application with routing setup
 */
function App() {
  return (
    <AuthProvider>
    <CityProvider>
      <ChatProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/city/:cityName" element={<CityPage />} />
              <Route path="/city/:cityName/chat/:chatId" element={<ChatPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/cities" element={<CitiesPage />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/mylens" element={<MylensPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </ChatProvider>
    </CityProvider>
    </AuthProvider>
  );
}

export default App;
