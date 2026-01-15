import Header from './Header';
import Footer from './Footer';

/**
 * Layout component
 * Wraps pages with Header and Footer
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Page content
 */
function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  );
}

export default Layout;
