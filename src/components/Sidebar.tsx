import { LayoutDashboard, Users, CircleUser as UserCircle, Settings, LogOut, Brain } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from '../hooks/useNavigate';

type SidebarProps = {
  activeTab: string;
  onTabChange: (tab: string) => void;
};

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('landing');
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'screenies', label: 'Screenies', icon: Users },
    { id: 'profile', label: 'My Profile', icon: UserCircle },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="w-72 bg-gradient-to-b from-blue-600 to-blue-700 shadow-xl flex flex-col py-8 px-4">
      <div className="flex items-center gap-3 mb-10 px-4">
        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
          <Brain className="w-7 h-7 text-blue-600" />
        </div>
        <div>
          <h2 className="text-white font-bold text-xl">DyslyzeML</h2>
          <p className="text-blue-100 text-xs">Assessment Platform</p>
        </div>
      </div>

      <div className="flex-1 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-white text-blue-600 shadow-lg font-semibold'
                  : 'text-blue-50 hover:bg-blue-500 hover:text-white'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : ''}`} />
              <span className="text-sm">{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="pt-6 border-t border-blue-500">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-blue-50 hover:bg-red-500 hover:text-white transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}
