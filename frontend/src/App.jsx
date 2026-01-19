import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
 * App component
 * Main application with routing setup
 */
function App() {
  return (
    <AuthProvider>
    <CityProvider>
      <ChatProvider>
        <BrowserRouter>
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
