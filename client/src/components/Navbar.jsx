import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Package, User, LogOut } from 'lucide-react';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <Package className="h-8 w-8 text-primary-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">
                SafeSwap
              </span>
            </Link>

            <div className="hidden md:ml-10 md:flex md:space-x-8">
              <Link
                to="/listings"
                className="text-gray-700 hover:text-primary-600 px-3 py-2 text-sm font-medium"
              >
                Browse
              </Link>
              {isAuthenticated && (
                <Link
                  to="/create-listing"
                  className="text-gray-700 hover:text-primary-600 px-3 py-2 text-sm font-medium"
                >
                  Sell
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <Link
                  to="/profile"
                  className="flex items-center text-gray-700 hover:text-primary-600"
                >
                  <User className="h-5 w-5 mr-1" />
                  <span className="hidden md:inline">{user?.phone}</span>
                </Link>
                <button
                  onClick={logout}
                  className="flex items-center text-gray-700 hover:text-primary-600"
                >
                  <LogOut className="h-5 w-5 mr-1" />
                  <span className="hidden md:inline">Logout</span>
                </button>
              </div>
            ) : (
              <Link to="/login" className="btn-primary">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
