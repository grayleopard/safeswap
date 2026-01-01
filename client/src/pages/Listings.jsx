import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { MapPin, CheckCircle, Shield } from 'lucide-react';

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

  // MVP Spec: Age ranges (exact format)
  const ageRanges = [
    '0-6mo',
    '6-12mo',
    '12-18mo',
    '18-24mo',
    '2-3yr',
    '3-5yr',
    '5+',
  ];

  // MVP Spec: Categories
  const categories = [
    { value: 'gear', label: 'Gear' },
    { value: 'clothing', label: 'Clothing' },
    { value: 'toys', label: 'Toys' },
    { value: 'furniture', label: 'Furniture' },
    { value: 'feeding', label: 'Feeding' },
    { value: 'safety', label: 'Safety' },
    { value: 'other', label: 'Other' },
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

        {/* Search Bar */}
        <div className="card mb-6">
          <input
            type="text"
            placeholder="Search for baby gear, toys, clothing..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="input-field w-full text-lg"
          />
        </div>

        {/* MVP Spec: Quick Age Filter Buttons */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Age Range</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilters({ ...filters, ageRange: '' })}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filters.ageRange === ''
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:border-primary-600'
              }`}
            >
              All Ages
            </button>
            {ageRanges.map((range) => (
              <button
                key={range}
                onClick={() => setFilters({ ...filters, ageRange: range })}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filters.ageRange === range
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:border-primary-600'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* Category Filter */}
        <div className="card mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="input-field"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => setFilters({ ageRange: '', category: '', search: '' })}
                className="btn-secondary w-full"
              >
                Clear All Filters
              </button>
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
                className="card hover:shadow-lg transition-shadow relative"
              >
                {/* Primary Photo */}
                <div className="relative mb-4">
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

                  {/* MVP Spec: Safety Verified Badge */}
                  {listing.safety_checked && !listing.has_recalls && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full flex items-center text-xs font-semibold">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Safety Verified ✓
                    </div>
                  )}
                </div>

                {/* Title */}
                <h3 className="font-semibold text-lg mb-2 line-clamp-2">{listing.title}</h3>

                {/* Price with % off retail if provided */}
                <div className="mb-3">
                  <p className="text-2xl font-bold text-primary-600">
                    ${listing.price}
                  </p>
                  {listing.original_price && (
                    <p className="text-sm text-gray-500">
                      <span className="line-through">${listing.original_price}</span>
                      {' '}
                      <span className="text-green-600 font-semibold">
                        {Math.round((1 - listing.price / listing.original_price) * 100)}% off
                      </span>
                    </p>
                  )}
                </div>

                {/* Age Range & Condition */}
                <div className="flex gap-2 mb-3">
                  {listing.age_range && (
                    <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                      {listing.age_range}
                    </span>
                  )}
                  {listing.condition && (
                    <span className="inline-block px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded">
                      {listing.condition}
                    </span>
                  )}
                </div>

                {/* Distance/Location (ZIP for now) */}
                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                  <span>{listing.location_zip || 'Location not specified'}</span>
                </div>

                {/* MVP Spec: Verified Parent Badge */}
                {listing.seller_is_verified_parent && (
                  <div className="flex items-center text-sm text-primary-600 font-medium">
                    <Shield className="h-4 w-4 mr-1" />
                    Verified Parent
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
