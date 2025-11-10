import { useEffect, useState } from 'react';
import { Heart, Calendar, DollarSign } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Layout from '../components/Layout';

type SponsorshipWithDetails = {
  id: string;
  start_date: string;
  status: string;
  monthly_amount: number;
  child: {
    first_name: string;
    last_name: string;
    photo_url: string;
  };
  sponsor: {
    full_name: string;
    email: string;
  };
};

export default function AdminSponsorships() {
  const [sponsorships, setSponsorships] = useState<SponsorshipWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSponsorships();
  }, []);

  const loadSponsorships = async () => {
    try {
      const { data, error } = await supabase
        .from('sponsorships')
        .select(`
          *,
          child:children(first_name, last_name, photo_url),
          sponsor:users_profile(full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSponsorships(data as any || []);
    } catch (error) {
      console.error('Error loading sponsorships:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-700';
      case 'Paused':
        return 'bg-yellow-100 text-yellow-700';
      case 'Cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
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
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Manage Sponsorships</h1>
        <p className="text-lg text-gray-600">View all active and past sponsorships</p>
      </div>

      {sponsorships.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
          <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Sponsorships Yet</h2>
          <p className="text-gray-600">Sponsorships will appear here once children are sponsored.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sponsorships.map((sponsorship) => (
            <div key={sponsorship.id} className="bg-white rounded-2xl shadow-sm hover:shadow-md transition overflow-hidden">
              <div className="aspect-[16/9] overflow-hidden bg-gray-200">
                {sponsorship.child.photo_url ? (
                  <img
                    src={sponsorship.child.photo_url}
                    alt={`${sponsorship.child.first_name} ${sponsorship.child.last_name}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Heart className="w-12 h-12 text-gray-400" />
                  </div>
                )}
              </div>

              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">
                    {sponsorship.child.first_name} {sponsorship.child.last_name}
                  </h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(sponsorship.status)}`}>
                    {sponsorship.status}
                  </span>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center text-gray-700">
                    <Heart className="w-5 h-5 mr-3 text-red-600" />
                    <span className="font-medium">{sponsorship.sponsor.full_name}</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <Calendar className="w-5 h-5 mr-3 text-red-600" />
                    <span>Since {formatDate(sponsorship.start_date)}</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <DollarSign className="w-5 h-5 mr-3 text-red-600" />
                    <span>${sponsorship.monthly_amount}/month</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
