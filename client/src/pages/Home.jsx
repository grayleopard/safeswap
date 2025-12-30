import { Link } from 'react-router-dom';
import { Package, Shield, MapPin, MessageSquare } from 'lucide-react';

const Home = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold sm:text-5xl md:text-6xl">
              SafeSwap
            </h1>
            <p className="mt-3 max-w-md mx-auto text-xl sm:text-2xl md:mt-5 md:max-w-3xl">
              The trusted marketplace for baby & kids gear
            </p>
            <p className="mt-3 max-w-md mx-auto text-base sm:text-lg md:mt-5 md:max-w-2xl">
              Buy and sell with confidence. Every item checked for safety recalls.
            </p>
            <div className="mt-10 flex justify-center gap-4">
              <Link
                to="/listings"
                className="btn-primary bg-white text-primary-600 hover:bg-gray-100"
              >
                Browse Listings
              </Link>
              <Link
                to="/create-listing"
                className="btn-outline border-white text-white hover:bg-white/10"
              >
                Sell Your Gear
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="text-center">
            <div className="flex justify-center">
              <Shield className="h-12 w-12 text-primary-600" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">Safety First</h3>
            <p className="mt-2 text-gray-600">
              Automatic recall checking on every listing
            </p>
          </div>

          <div className="text-center">
            <div className="flex justify-center">
              <MapPin className="h-12 w-12 text-primary-600" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">Hyper-Local</h3>
            <p className="mt-2 text-gray-600">
              Find items near you, no shipping hassle
            </p>
          </div>

          <div className="text-center">
            <div className="flex justify-center">
              <MessageSquare className="h-12 w-12 text-primary-600" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">Direct Messaging</h3>
            <p className="mt-2 text-gray-600">
              Chat securely with other parents
            </p>
          </div>

          <div className="text-center">
            <div className="flex justify-center">
              <Package className="h-12 w-12 text-primary-600" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">Age Filtering</h3>
            <p className="mt-2 text-gray-600">
              Find exactly what you need for your child's age
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
