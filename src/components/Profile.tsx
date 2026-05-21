import { useAuth } from '../contexts/AuthContext';
import { CircleUser as UserCircle, Mail, Building, Briefcase } from 'lucide-react';

export default function Profile() {
  const { user } = useAuth();

  const userName = user?.user_metadata?.full_name || 'User';
  const orgName = user?.user_metadata?.organization_name || 'N/A';
  const orgType = user?.user_metadata?.organization_type || 'N/A';

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Profile</h1>

      <div className="max-w-3xl">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="flex items-start gap-6 mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-4xl">{userName[0].toUpperCase()}</span>
            </div>

            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">{userName}</h2>
              <p className="text-gray-600">Account Owner</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <Mail className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-600 mb-1">Email Address</label>
                <p className="text-lg text-gray-900">{user?.email}</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <Building className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-600 mb-1">Organization Name</label>
                <p className="text-lg text-gray-900">{orgName}</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <Briefcase className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-600 mb-1">Organization Type</label>
                <p className="text-lg text-gray-900 capitalize">{orgType}</p>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
              Edit Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
