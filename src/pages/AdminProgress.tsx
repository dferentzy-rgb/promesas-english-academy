import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Save, TrendingUp } from 'lucide-react';
import { supabase, Child } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';

export default function AdminProgress() {
  const { childId } = useParams<{ childId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [child, setChild] = useState<Child | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    english_level_after: '',
  });

  useEffect(() => {
    if (childId) {
      loadChild();
    }
  }, [childId]);

  const loadChild = async () => {
    try {
      const { data, error } = await supabase
        .from('children')
        .select('*')
        .eq('id', childId)
        .maybeSingle();

      if (error) throw error;
      setChild(data);
      setFormData((prev) => ({
        ...prev,
        english_level_after: data?.english_level || '',
      }));
    } catch (error) {
      console.error('Error loading child:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!childId || !user) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('progress_updates').insert([
        {
          child_id: childId,
          created_by: user.id,
          ...formData,
        },
      ]);

      if (error) throw error;

      if (formData.english_level_after) {
        await supabase
          .from('children')
          .update({ english_level: formData.english_level_after })
          .eq('id', childId);
      }

      navigate('/admin/children');
    } catch (error: any) {
      alert(error.message || 'Failed to add progress update');
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (!child) {
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
      <div className="max-w-3xl">
        <Link to="/admin/children" className="text-red-600 hover:text-red-700 mb-6 inline-block">
          ← Back to Children
        </Link>

        <div className="bg-white rounded-2xl shadow-sm p-8">
          <div className="flex items-center mb-6">
            <TrendingUp className="w-8 h-8 text-red-600 mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Add Progress Update</h1>
              <p className="text-gray-600">
                {child.first_name} {child.last_name}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="e.g., Week 4: Present Simple, Vocabulary: School"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={6}
                placeholder="Describe the child's progress, achievements, and areas of improvement..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                English Level (After Update)
              </label>
              <input
                type="text"
                name="english_level_after"
                value={formData.english_level_after}
                onChange={handleChange}
                placeholder="e.g., A1, A2, Intermediate"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-600 mt-2">
                Current level: <span className="font-semibold">{child.english_level}</span>. Leave blank to keep the same.
              </p>
            </div>

            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <Link
                to="/admin/children"
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition font-medium"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                <Save className="w-5 h-5 mr-2" />
                {loading ? 'Saving...' : 'Add Update'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
