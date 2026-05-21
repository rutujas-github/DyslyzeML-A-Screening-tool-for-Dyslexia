import { useState } from 'react';
import { useNavigate } from '../hooks/useNavigate';
import { useAuth } from '../contexts/AuthContext';
import { Brain } from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    password: '',
    repeatPassword: '',
    organizationType: '',
    organizationName: '',
    acceptTerms: false
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.acceptTerms) {
      setError('Please accept the terms and conditions');
      return;
    }

    if (formData.password !== formData.repeatPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    const { error } = await signUp(formData.email, formData.password, {
      full_name: formData.fullName,
      organization_type: formData.organizationType,
      organization_name: formData.organizationName
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      navigate('login');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center p-8">
      <div className="w-full max-w-6xl grid grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl shadow-xl p-10">
          <div className="flex items-center gap-2 mb-8">
            <Brain className="w-8 h-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">DyslyzeML</span>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-8">Sign Up for our DyslyzeML Screening platform</h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Your work email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Organization type</label>
                <select
                  required
                  value={formData.organizationType}
                  onChange={(e) => setFormData({ ...formData, organizationType: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent outline-none"
                >
                  <option value="">Select...</option>
                  <option value="school">School</option>
                  <option value="clinic">Clinic</option>
                  <option value="individual">Individual</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full name</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Organization name</label>
                <input
                  type="text"
                  required
                  value={formData.organizationName}
                  onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Repeat Password</label>
                <input
                  type="password"
                  required
                  value={formData.repeatPassword}
                  onChange={(e) => setFormData({ ...formData, repeatPassword: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent outline-none"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="terms"
                checked={formData.acceptTerms}
                onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
                className="w-4 h-4 text-cyan-400 rounded focus:ring-cyan-400"
              />
              <label htmlFor="terms" className="text-sm text-gray-700">
                I accept the{' '}
                <button
                  type="button"
                  onClick={() => navigate('terms')}
                  className="text-blue-600 hover:underline"
                >
                  terms and conditions
                </button>
                .
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-cyan-400 text-white rounded-lg hover:bg-cyan-500 transition-colors font-medium disabled:opacity-50"
            >
              {loading ? 'Signing up...' : 'Sign Up'}
            </button>

            <p className="text-center text-gray-600">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => navigate('login')}
                className="text-blue-600 hover:underline font-medium"
              >
                Login
              </button>
            </p>
          </form>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl shadow-xl p-10 flex flex-col justify-center text-white">
          <h2 className="text-5xl font-bold mb-8">DyslyzeML</h2>
          <ul className="space-y-4 text-lg">
            <li className="flex items-start gap-3">
              <span className="text-2xl">•</span>
              <span>AI-based dyslexia screening</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-2xl">•</span>
              <span>Fast, non-invasive assessment</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-2xl">•</span>
              <span>Actionable personalized reports-AI-powered screening</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
