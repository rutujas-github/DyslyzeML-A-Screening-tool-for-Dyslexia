import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Screenie } from '../lib/supabase';
import { Plus, X } from 'lucide-react';
import { useNavigate } from '../hooks/useNavigate';

export default function Screenies() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [screenies, setScreenies] = useState<Screenie[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    grade: '',
    parent_guardian: '',
    contact_number: ''
  });

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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    const { error } = await supabase
      .from('screenies')
      .insert([
        {
          user_id: user.id,
          name: formData.name,
          age: parseInt(formData.age),
          grade: formData.grade,
          parent_guardian: formData.parent_guardian,
          contact_number: formData.contact_number,
          reading_test_completed: false,
          handwriting_test_completed: false
        }
      ]);

    if (!error) {
      setFormData({
        name: '',
        age: '',
        grade: '',
        parent_guardian: '',
        contact_number: ''
      });
      setShowAddForm(false);
      fetchScreenies();
    }

    setLoading(false);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Screenies Management</h1>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          Add a Screeny
        </button>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-8 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Add New Student</h2>
              <button
                onClick={() => setShowAddForm(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none"
                  placeholder="Enter student's full name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Age *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="100"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none"
                    placeholder="Age"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Grade/Class *</label>
                  <input
                    type="text"
                    required
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none"
                    placeholder="e.g., 5th Grade"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Parent/Guardian Name *</label>
                <input
                  type="text"
                  required
                  value={formData.parent_guardian}
                  onChange={(e) => setFormData({ ...formData, parent_guardian: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none"
                  placeholder="Enter parent or guardian name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contact Number *</label>
                <input
                  type="tel"
                  required
                  value={formData.contact_number}
                  onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none"
                  placeholder="Enter contact number"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {screenies.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No students yet</h3>
            <p className="text-gray-600 mb-6">Get started by adding your first student</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Add Your First Student
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {screenies.map((screenie) => (
              <div
                key={screenie.id}
                onClick={() => navigate('screenie-detail', { id: screenie.id })}
                className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border-2 border-blue-100 hover:border-blue-300 transition-all cursor-pointer hover:shadow-lg"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-xl">{screenie.name[0].toUpperCase()}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-medium text-gray-600">Grade</span>
                    <p className="text-sm font-bold text-gray-900">{screenie.grade}</p>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-1">{screenie.name}</h3>
                <p className="text-sm text-gray-600 mb-4">Age: {screenie.age}</p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Reading Test:</span>
                    <span className={`font-medium ${screenie.reading_test_completed ? 'text-green-600' : 'text-orange-600'}`}>
                      {screenie.reading_test_completed ? 'Completed' : 'Pending'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Handwriting Test:</span>
                    <span className={`font-medium ${screenie.handwriting_test_completed ? 'text-green-600' : 'text-orange-600'}`}>
                      {screenie.handwriting_test_completed ? 'Completed' : 'Pending'}
                    </span>
                  </div>
                </div>

                <button className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                  View Details
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
