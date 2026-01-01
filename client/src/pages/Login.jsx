import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Login = () => {
  const [step, setStep] = useState('phone'); // 'phone', 'verify', or 'details'
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);
  const [userDetails, setUserDetails] = useState({
    username: '',
    name: '',
    locationZip: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSendCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/auth/send-code', { phone });
      setStep('verify');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/verify', { phone, code });

      // Check if this is a new user (no username set)
      if (!response.data.user.username) {
        setIsNewUser(true);
        setStep('details');
      } else {
        // Existing user - log them in
        await login(phone, code);
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Complete user profile
      await api.post('/auth/complete-profile', {
        phone,
        code,
        ...userDetails,
      });

      // Now log them in
      await login(phone, code);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete signup');
    } finally {
      setLoading(false);
    }
  };

  const handleDetailsChange = (e) => {
    const { name, value } = e.target;
    setUserDetails(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="card">
          <h2 className="text-2xl font-bold text-center mb-6">
            {step === 'details' ? 'Complete Your Profile' : 'Sign in to Cradle'}
          </h2>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {step === 'phone' && (
            <form onSubmit={handleSendCode}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="input-field"
                  required
                />
                <p className="mt-2 text-sm text-gray-500">
                  We'll send you a verification code
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? 'Sending...' : 'Send Code'}
              </button>
            </form>
          )}

          {step === 'verify' && (
            <form onSubmit={handleVerifyCode}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Verification Code
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="000000"
                  className="input-field"
                  maxLength={6}
                  required
                />
                <p className="mt-2 text-sm text-gray-500">
                  Enter the 6-digit code sent to {phone}
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep('phone');
                  setCode('');
                  setError('');
                }}
                className="btn-secondary w-full mt-2"
              >
                Change Phone Number
              </button>
            </form>
          )}

          {step === 'details' && (
            <form onSubmit={handleCompleteSignup}>
              <p className="text-sm text-gray-600 mb-4">
                Just a few more details to get started!
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="username"
                  value={userDetails.username}
                  onChange={handleDetailsChange}
                  placeholder="e.g., sarah_m"
                  className="input-field"
                  pattern="[a-zA-Z0-9_]{3,50}"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  3-50 characters, letters, numbers, and underscores only
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={userDetails.name}
                  onChange={handleDetailsChange}
                  placeholder="e.g., Sarah Martinez"
                  className="input-field"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ZIP Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="locationZip"
                  value={userDetails.locationZip}
                  onChange={handleDetailsChange}
                  placeholder="98001"
                  className="input-field"
                  pattern="[0-9]{5}"
                  maxLength={5}
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  5-digit ZIP code for your area
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? 'Creating Account...' : 'Complete Signup'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
