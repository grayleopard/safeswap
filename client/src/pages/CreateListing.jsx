import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Upload, AlertCircle } from 'lucide-react';

// MVP Spec: Categories (lowercase per spec)
const CATEGORIES = [
  { value: 'gear', label: 'Gear (Strollers, Carriers, etc.)' },
  { value: 'clothing', label: 'Clothing' },
  { value: 'toys', label: 'Toys' },
  { value: 'furniture', label: 'Furniture (Cribs, High Chairs, etc.)' },
  { value: 'feeding', label: 'Feeding' },
  { value: 'safety', label: 'Safety (Car Seats, Gates, etc.)' },
  { value: 'other', label: 'Other' },
];

// MVP Spec: Age ranges (exact format)
const AGE_RANGES = [
  '0-6mo',
  '6-12mo',
  '12-18mo',
  '18-24mo',
  '2-3yr',
  '3-5yr',
  '5+',
];

// MVP Spec: Conditions (exact format)
const CONDITIONS = [
  'Like New',
  'Excellent',
  'Very Good',
  'Good',
  'Fair',
];

const CreateListing = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [safetyWarning, setSafetyWarning] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    originalPrice: '',
    category: '',
    ageRange: '',
    condition: '',
    brand: '',
    isSmokeFree: null,
    isPetFree: null,
    locationZip: '',
    images: [],
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);

    // MVP Spec: 2-6 photos per listing
    const currentCount = formData.images.length;
    const remainingSlots = 6 - currentCount;

    if (currentCount >= 6) {
      setError('Maximum 6 photos allowed per listing');
      return;
    }

    if (files.length > remainingSlots) {
      setError(`Can only add ${remainingSlots} more photo(s). Maximum 6 photos total.`);
      return;
    }

    // For now, create object URLs (TODO: Integrate Cloudinary)
    const imageUrls = files.map(file => URL.createObjectURL(file));
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...imageUrls],
    }));
    setError(''); // Clear any previous errors
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSafetyWarning(null);

    // MVP Spec: 2-6 photos required
    if (formData.images.length < 2) {
      setError('Please upload at least 2 photos');
      setLoading(false);
      return;
    }

    if (formData.images.length > 6) {
      setError('Maximum 6 photos allowed');
      setLoading(false);
      return;
    }

    try {
      const response = await api.post('/listings', {
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
        category: formData.category,
        ageRange: formData.ageRange,
        condition: formData.condition,
        brand: formData.brand || null,
        isSmokeFree: formData.isSmokeFree,
        isPetFree: formData.isPetFree,
        locationZip: formData.locationZip,
        images: formData.images,
      });

      // Check for safety warnings
      if (response.data.has_recalls) {
        setSafetyWarning(response.data.recall_details);
      } else {
        navigate(`/listings/${response.data.id}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create listing');
    } finally {
      setLoading(false);
    }
  };

  if (safetyWarning) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
            <div className="flex items-start">
              <AlertCircle className="h-6 w-6 text-red-600 mt-1 mr-3 flex-shrink-0" />
              <div>
                <h2 className="text-xl font-bold text-red-900 mb-2">
                  Safety Recall Detected
                </h2>
                <p className="text-red-800 mb-4">{safetyWarning}</p>
                <p className="text-red-700 mb-6">
                  We cannot allow the listing of recalled items for safety reasons.
                  Please verify your product information or choose a different item.
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      setSafetyWarning(null);
                      setFormData(prev => ({ ...prev, brand: '', model: '' }));
                    }}
                    className="btn-primary"
                  >
                    Edit Listing
                  </button>
                  <button
                    onClick={() => navigate('/listings')}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="card">
          <h1 className="text-3xl font-bold mb-2">Create New Listing</h1>
          <p className="text-gray-600 mb-6">
            List your baby or kids gear for sale. All items are automatically checked for safety recalls.
          </p>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Basic Information */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Basic Information</h2>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., Graco SnugRide Car Seat"
                  className="input-field"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe the item's condition, features, and any included accessories..."
                  rows={4}
                  className="input-field resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">$</span>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className="input-field pl-7"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Original Retail Price
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">$</span>
                    <input
                      type="number"
                      name="originalPrice"
                      value={formData.originalPrice}
                      onChange={handleChange}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className="input-field pl-7"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Optional - helps show buyers the value
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="input-field"
                    required
                  >
                    <option value="">Select a category</option>
                    {CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Condition <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="condition"
                    value={formData.condition}
                    onChange={handleChange}
                    className="input-field"
                    required
                  >
                    <option value="">Select condition</option>
                    {CONDITIONS.map(cond => (
                      <option key={cond} value={cond}>{cond}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Age Range <span className="text-red-500">*</span>
                </label>
                <select
                  name="ageRange"
                  value={formData.ageRange}
                  onChange={handleChange}
                  className="input-field"
                  required
                >
                  <option value="">Select age range</option>
                  {AGE_RANGES.map(age => (
                    <option key={age} value={age}>{age}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Smoke-Free Home?
                  </label>
                  <select
                    name="isSmokeFree"
                    value={formData.isSmokeFree === null ? '' : formData.isSmokeFree}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      isSmokeFree: e.target.value === '' ? null : e.target.value === 'true'
                    }))}
                    className="input-field"
                  >
                    <option value="">Prefer not to say</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pet-Free Home?
                  </label>
                  <select
                    name="isPetFree"
                    value={formData.isPetFree === null ? '' : formData.isPetFree}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      isPetFree: e.target.value === '' ? null : e.target.value === 'true'
                    }))}
                    className="input-field"
                  >
                    <option value="">Prefer not to say</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Brand
                  </label>
                  <input
                    type="text"
                    name="brand"
                    value={formData.brand}
                    onChange={handleChange}
                    placeholder="e.g., Graco"
                    className="input-field"
                  />
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Location</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ZIP Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="locationZip"
                  value={formData.locationZip}
                  onChange={handleChange}
                  placeholder="98001"
                  pattern="[0-9]{5}"
                  maxLength={5}
                  className="input-field"
                  required
                />
                <p className="mt-1 text-sm text-gray-500">
                  Pickup location ZIP code
                </p>
              </div>
            </div>

            {/* Images */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-2">Photos <span className="text-red-500">*</span></h2>
              <p className="text-sm text-gray-600 mb-4">
                Upload 2-6 photos of your item
              </p>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <label className="cursor-pointer">
                  <span className="text-primary-600 hover:text-primary-700 font-medium">
                    Click to upload
                  </span>
                  <span className="text-gray-600"> or drag and drop</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
                <p className="text-sm text-gray-500 mt-2">
                  PNG, JPG up to 10MB each
                </p>
              </div>

              {formData.images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex-1"
              >
                {loading ? 'Creating Listing...' : 'Create Listing'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/listings')}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateListing;
