import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { MapPin, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const Listings = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    ageRange: '',
    category: '',
    search: '',
  });

  useEffect(() => {
    fetchListings();
  }, [filters]);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const response = await api.get('/listings', { params: filters });
      setListings(response.data);
    } catch (error) {
      console.error('Failed to fetch listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const ageRanges = [
    { value: '0-6', label: '0-6 months' },
    { value: '6-12', label: '6-12 months' },
    { value: '12-24', label: '1-2 years' },
    { value: '24-48', label: '2-4 years' },
    { value: '48+', label: '4+ years' },
  ];

  const categories = [
    'Strollers',
    'Car Seats',
    'Cribs & Bassinets',
    'Toys',
    'Clothing',
    'Feeding',
    'Books',
    'Other',
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Browse Listings</h1>
          <Link to="/create-listing" className="btn-primary">
            Create Listing
          </Link>
        </div>

        {/* Filters */}
        <div className="card mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <input
                type="text"
                placeholder="Search items..."
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Age Range
              </label>
              <select
                value={filters.ageRange}
                onChange={(e) =>
                  setFilters({ ...filters, ageRange: e.target.value })
                }
                className="input-field"
              >
                <option value="">All Ages</option>
                {ageRanges.map((range) => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) =>
                  setFilters({ ...filters, category: e.target.value })
                }
                className="input-field"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Listings Grid */}
        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : listings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No listings found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <Link
                key={listing.id}
                to={`/listings/${listing.id}`}
                className="card hover:shadow-lg transition-shadow"
              >
                <div className="aspect-w-16 aspect-h-9 bg-gray-200 rounded-lg mb-4">
                  {listing.images?.[0] ? (
                    <img
                      src={listing.images[0]}
                      alt={listing.title}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-48 flex items-center justify-center bg-gray-200 rounded-lg">
                      <span className="text-gray-400">No image</span>
                    </div>
                  )}
                </div>

                <h3 className="font-semibold text-lg mb-2">{listing.title}</h3>
                <p className="text-2xl font-bold text-primary-600 mb-2">
                  ${listing.price}
                </p>

                <div className="flex items-center text-sm text-gray-600 mb-1">
                  <MapPin className="h-4 w-4 mr-1" />
                  {listing.location}
                </div>

                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="h-4 w-4 mr-1" />
                  {formatDistanceToNow(new Date(listing.createdAt), {
                    addSuffix: true,
                  })}
                </div>

                {listing.safetyStatus && (
                  <div className="mt-3">
                    <span
                      className={`inline-block px-2 py-1 text-xs font-semibold rounded ${
                        listing.safetyStatus === 'safe'
                          ? 'bg-green-100 text-green-800'
                          : listing.safetyStatus === 'warning'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {listing.safetyStatus === 'safe'
                        ? 'No Recalls'
                        : listing.safetyStatus === 'warning'
                        ? 'Check Recalls'
                        : 'Safety Alert'}
                    </span>
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Listings;
