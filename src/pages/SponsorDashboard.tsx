import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Heart, MessageCircle, Calendar, TrendingUp } from 'lucide-react';
import { supabase, Child, Sponsorship } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';

type SponsoredChild = Child & {
  sponsorship: Sponsorship;
  lastUpdate?: string;
};

export default function SponsorDashboard() {
  const [sponsoredChildren, setSponsoredChildren] = useState<SponsoredChild[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadSponsoredChildren();
    }
  }, [user]);

  const loadSponsoredChildren = async () => {
    try {
      const { data: sponsorships, error: sponsorshipError } = await supabase
        .from('sponsorships')
        .select('*, children(*)')
        .eq('sponsor_id', user?.id)
        .eq('status', 'Active');

      if (sponsorshipError) throw sponsorshipError;

      const childrenData = await Promise.all(
        (sponsorships || []).map(async (sponsorship: any) => {
          const { data: updates } = await supabase
            .from('progress_updates')
            .select('created_at')
            .eq('child_id', sponsorship.children.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          return {
            ...sponsorship.children,
            sponsorship: {
              id: sponsorship.id,
              child_id: sponsorship.child_id,
              sponsor_id: sponsorship.sponsor_id,
              start_date: sponsorship.start_date,
              status: sponsorship.status,
              monthly_amount: sponsorship.monthly_amount,
              notes: sponsorship.notes,
              created_at: sponsorship.created_at,
            },
            lastUpdate: updates?.created_at,
          };
        })
      );

      setSponsoredChildren(childrenData);
    } catch (error) {
      console.error('Error loading sponsored children:', error);
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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
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
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Your Sponsorships</h1>
        <p className="text-lg text-gray-600">
          Welcome back! Here are the children you're sponsoring.
        </p>
      </div>

      {sponsoredChildren.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
          <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Sponsorships Yet</h2>
          <p className="text-gray-600 mb-6">
            You haven't sponsored any children yet. Browse available children to get started.
          </p>
          <Link
            to="/children"
            className="inline-flex items-center bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition font-medium"
          >
            <Heart className="w-5 h-5 mr-2" />
            View Available Children
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {sponsoredChildren.map((child) => (
            <div key={child.id} className="bg-white rounded-2xl shadow-sm hover:shadow-md transition overflow-hidden">
              <div className="aspect-[16/9] overflow-hidden bg-gray-200">
                {child.photo_url ? (
                  <img
                    src={child.photo_url}
                    alt={`${child.first_name} ${child.last_name}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Heart className="w-16 h-16 text-gray-400" />
                  </div>
                )}
              </div>

              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">
                      {child.first_name} {child.last_name}
                    </h3>
                    <p className="text-gray-600">
                      {calculateAge(child.birthdate)} years old • {child.gender}
                    </p>
                  </div>
                  <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
                    {child.program_status}
                  </span>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-gray-700">
                    <TrendingUp className="w-5 h-5 mr-3 text-red-600" />
                    <span>
                      English Level: <span className="font-semibold">{child.english_level}</span>
                    </span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <Calendar className="w-5 h-5 mr-3 text-red-600" />
                    <span>
                      Sponsoring since {formatDate(child.sponsorship.start_date)}
                    </span>
                  </div>
                  {child.lastUpdate && (
                    <div className="flex items-center text-gray-700">
                      <BookOpen className="w-5 h-5 mr-3 text-red-600" />
                      <span>Last update: {formatDate(child.lastUpdate)}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <Link
                    to={`/child/${child.id}`}
                    className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition font-medium text-center"
                  >
                    View Profile
                  </Link>
                  <Link
                    to={`/messages?childId=${child.id}`}
                    className="flex items-center justify-center bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition"
                  >
                    <MessageCircle className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-12 bg-gradient-to-br from-red-50 to-red-50 rounded-2xl p-8 border border-red-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Payment Information</h2>
        <p className="text-gray-700 leading-relaxed">
          Payment processing is currently handled offline by Promesas English Academy staff. Your monthly contribution of $35 per child directly supports their English education, including tuition, learning materials, and ongoing academic support.
        </p>
      </div>
    </Layout>
  );
}
