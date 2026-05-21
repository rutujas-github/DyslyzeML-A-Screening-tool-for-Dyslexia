import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import DashboardHome from '../components/DashboardHome';
import Screenies from '../components/Screenies';
import Profile from '../components/Profile';
import SettingsPage from '../components/SettingsPage';

export default function Dashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="flex-1 overflow-auto">
        {activeTab === 'dashboard' && <DashboardHome />}
        {activeTab === 'screenies' && <Screenies />}
        {activeTab === 'profile' && <Profile />}
        {activeTab === 'settings' && <SettingsPage />}
      </div>
    </div>
  );
}
