import { Link, useLocation } from 'react-router-dom';
import { Leaf, Upload, History, Radio } from 'lucide-react';

const Navbar = () => {
  const location = useLocation();

  const links = [
    { to: '/', label: 'Home', icon: Leaf },
    { to: '/upload', label: 'Upload', icon: Upload },
    { to: '/history', label: 'History', icon: History },
    { to: '/esp-monitor', label: 'ESP Monitor', icon: Radio },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-green-200/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <span className="font-display text-xl font-bold gradient-text">AgroDetect AI</span>
          </Link>

          <div className="flex space-x-1">
            {links.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-all font-medium ${
                  location.pathname === to
                    ? 'bg-green-500 text-white shadow-lg'
                    : 'text-gray-700 hover:text-green-600 hover:bg-green-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
