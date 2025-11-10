import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Heart, MessageCircle, TrendingUp, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Layout from '../components/Layout';

type Stats = {
  totalChildren: number;
  sponsoredChildren: number;
  availableChildren: number;
  totalSponsors: number;
  pendingMessages: number;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalChildren: 0,
    sponsoredChildren: 0,
    availableChildren: 0,
    totalSponsors: 0,
    pendingMessages: 0,
  });
  const [recentUpdates, setRecentUpdates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [childrenRes, sponsorsRes, messagesRes, updatesRes] = await Promise.all([
        supabase.from('children').select('is_sponsored'),
        supabase.from('users_profile').select('id').eq('role', 'sponsor'),
        supabase.from('messages').select('id').eq('status', 'Pending Review'),
        supabase
          .from('progress_updates')
          .select('*, children(first_name, last_name)')
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      const children = childrenRes.data || [];
      const sponsoredCount = children.filter((c) => c.is_sponsored).length;

      setStats({
        totalChildren: children.length,
        sponsoredChildren: sponsoredCount,
        availableChildren: children.length - sponsoredCount,
        totalSponsors: sponsorsRes.data?.length || 0,
        pendingMessages: messagesRes.data?.length || 0,
      });

      setRecentUpdates(updatesRes.data || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-lg text-gray-600">Manage children, sponsorships, and communications</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-3xl font-bold text-gray-900">{stats.totalChildren}</span>
          </div>
          <h3 className="text-gray-600 font-medium">Total Children</h3>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <Heart className="w-6 h-6 text-red-600" />
            </div>
            <span className="text-3xl font-bold text-gray-900">{stats.sponsoredChildren}</span>
          </div>
          <h3 className="text-gray-600 font-medium">Sponsored Children</h3>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-yellow-600" />
            </div>
            <span className="text-3xl font-bold text-gray-900">{stats.availableChildren}</span>
          </div>
          <h3 className="text-gray-600 font-medium">Available Children</h3>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-3xl font-bold text-gray-900">{stats.pendingMessages}</span>
          </div>
          <h3 className="text-gray-600 font-medium">Pending Messages</h3>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Quick Actions</h2>
          </div>
          <div className="space-y-3">
            <Link
              to="/admin/children/new"
              className="block w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition font-medium text-center"
            >
              Add New Child
            </Link>
            <Link
              to="/admin/children"
              className="block w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition font-medium text-center"
            >
              Manage Children
            </Link>
            <Link
              to="/admin/messages"
              className="block w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition font-medium text-center flex items-center justify-center"
            >
              Review Messages
              {stats.pendingMessages > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {stats.pendingMessages}
                </span>
              )}
            </Link>
            <Link
              to="/admin/sponsorships"
              className="block w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition font-medium text-center"
            >
              Manage Sponsorships
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Progress Updates</h2>
          {recentUpdates.length === 0 ? (
            <p className="text-gray-600">No progress updates yet.</p>
          ) : (
            <div className="space-y-4">
              {recentUpdates.map((update: any) => (
                <div key={update.id} className="border-l-4 border-red-500 pl-4">
                  <h3 className="font-semibold text-gray-900">{update.title}</h3>
                  <p className="text-sm text-gray-600">
                    {update.children?.first_name} {update.children?.last_name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{formatDate(update.created_at)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
