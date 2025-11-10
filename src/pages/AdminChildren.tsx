import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Users, Filter } from 'lucide-react';
import { supabase, Child } from '../lib/supabase';
import Layout from '../components/Layout';

export default function AdminChildren() {
  const [children, setChildren] = useState<Child[]>([]);
  const [filter, setFilter] = useState<'all' | 'sponsored' | 'available'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChildren();
  }, [filter]);

  const loadChildren = async () => {
    try {
      let query = supabase.from('children').select('*').order('created_at', { ascending: false });

      if (filter === 'sponsored') {
        query = query.eq('is_sponsored', true);
      } else if (filter === 'available') {
        query = query.eq('is_sponsored', false);
      }

      const { data, error } = await query;
      if (error) throw error;
      setChildren(data || []);
    } catch (error) {
      console.error('Error loading children:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (birthdate: string) => {
    const today = new Date();
    const birth = new Date(birthdate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <Layout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Manage Children</h1>
          <p className="text-lg text-gray-600">View and edit child profiles</p>
        </div>
        <Link
          to="/admin/children/new"
          className="flex items-center bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition font-medium"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Child
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-gray-600" />
          <span className="font-medium text-gray-700">Filter:</span>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'all'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('sponsored')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'sponsored'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Sponsored
          </button>
          <button
            onClick={() => setFilter('available')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'available'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Available
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
      ) : children.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Children Found</h2>
          <p className="text-gray-600 mb-6">
            {filter === 'all'
              ? 'Add your first child to get started.'
              : `No ${filter} children found.`}
          </p>
          <Link
            to="/admin/children/new"
            className="inline-flex items-center bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition font-medium"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Child
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">Child</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">Age</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">Gender</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">English Level</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">Status</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">Sponsored</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {children.map((child) => (
                <tr key={child.id} className="hover:bg-gray-50 transition">
                  <td className="py-4 px-6">
                    <div className="flex items-center">
                      {child.photo_url ? (
                        <img
                          src={child.photo_url}
                          alt={`${child.first_name} ${child.last_name}`}
                          className="w-12 h-12 rounded-full object-cover mr-3"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-200 mr-3"></div>
                      )}
                      <div>
                        <p className="font-semibold text-gray-900">
                          {child.first_name} {child.last_name}
                        </p>
                        <p className="text-sm text-gray-600">{child.location}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-gray-700">{calculateAge(child.birthdate)}</td>
                  <td className="py-4 px-6 text-gray-700">{child.gender}</td>
                  <td className="py-4 px-6">
                    <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
                      {child.english_level}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-gray-700">{child.program_status}</span>
                  </td>
                  <td className="py-4 px-6">
                    {child.is_sponsored ? (
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                        Yes
                      </span>
                    ) : (
                      <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                        No
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex space-x-2">
                      <Link
                        to={`/admin/children/${child.id}`}
                        className="text-red-600 hover:text-red-700 transition"
                        title="Edit"
                      >
                        <Edit className="w-5 h-5" />
                      </Link>
                      <Link
                        to={`/admin/progress/${child.id}`}
                        className="text-blue-600 hover:text-blue-700 transition"
                        title="Add Progress"
                      >
                        <Plus className="w-5 h-5" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
}
