import { useState } from 'react';
import { useNavigate } from '../hooks/useNavigate';
import { useAuth } from '../contexts/AuthContext';
import { Brain } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      navigate('dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center p-8">
      <div className="w-full max-w-6xl grid grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl shadow-xl p-12 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-8">
            <Brain className="w-8 h-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">DyslyzeML</span>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-10">Login to DyslyzeML</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent outline-none"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-cyan-400 text-white rounded-lg hover:bg-cyan-500 transition-colors font-medium disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>

            <p className="text-center text-gray-600">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => navigate('register')}
                className="text-blue-600 hover:underline font-medium"
              >
                Register
              </button>
            </p>
          </form>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl shadow-xl p-12 flex flex-col justify-center text-white">
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
