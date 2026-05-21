import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Screenie } from '../lib/supabase';
import { TrendingUp, AlertCircle, FileText } from 'lucide-react';
import { useNavigate } from '../hooks/useNavigate';

export default function DashboardHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [screenies, setScreenies] = useState<Screenie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchScreenies();
  }, []);

  const fetchScreenies = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('screenies')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setScreenies(data);
    }
    setLoading(false);
  };

  const getDate = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const now = new Date();
    return `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]}`;
  };

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome, <span className="text-blue-600">{userName}</span>!
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="text-gray-600">VIT</span>
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">{userName[0].toUpperCase()}</span>
            </div>
            <div>
              <div className="font-semibold text-gray-900">{userName}</div>
              <div className="text-sm text-gray-600">Owner</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-gray-700 text-lg mb-3">Today is</h3>
          <p className="text-3xl font-bold text-gray-900">{getDate()}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-gray-700 text-lg mb-3">My Active Students</h3>
          <p className="text-5xl font-bold text-gray-900">{screenies.length}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-gray-700 text-lg mb-3">Students capacity</h3>
          <div className="flex items-center gap-4">
            <p className="text-3xl font-bold text-gray-900">{screenies.length}/0</p>
            <button className="px-4 py-2 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium">
              Update subscription
            </button>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6 mb-8 border border-blue-100">
        <div className="flex items-start gap-4">
          <TrendingUp className="w-8 h-8 text-blue-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">How can we improve?</h3>
            <button className="px-6 py-2 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-white transition-colors font-medium">
              Give your feedback →
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-200">
        <div className="flex items-start gap-4 mb-6">
          <FileText className="w-8 h-8 text-blue-600" />
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">Your notes</h3>
            <p className="text-gray-600">Most urgent notes are at the top</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Student</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Notes</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Deadline</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {screenies.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-gray-500">
                    No students added yet
                  </td>
                </tr>
              ) : (
                screenies.map((screenie) => (
                  <tr key={screenie.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <button
                        onClick={() => navigate('screenie-detail', { id: screenie.id })}
                        className="text-blue-600 hover:underline font-medium"
                      >
                        {screenie.name}
                      </button>
                    </td>
                    <td className="py-4 px-4 text-gray-600">-</td>
                    <td className="py-4 px-4 text-gray-600">-</td>
                    <td className="py-4 px-4">
                      <button
                        onClick={() => navigate('screenie-detail', { id: screenie.id })}
                        className="text-blue-600 hover:underline"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Word reading assessment status check</h3>
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-blue-900">
                A Word Reading Assessment (WRA) every 30 days is recommended for accurate progress tracking.
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Student</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Fluency</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Last assessment</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {screenies.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-gray-500">
                    No assessments yet
                  </td>
                </tr>
              ) : (
                screenies.map((screenie) => (
                  <tr key={screenie.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4 font-medium text-gray-900">{screenie.name}</td>
                    <td className="py-4 px-4 text-gray-600">-</td>
                    <td className="py-4 px-4 text-gray-600">-</td>
                    <td className="py-4 px-4">
                      <button
                        onClick={() => navigate('screenie-detail', { id: screenie.id })}
                        className="text-blue-600 hover:underline"
                      >
                        Start assessment
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
