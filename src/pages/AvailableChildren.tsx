import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Heart, MapPin, Languages } from 'lucide-react';
import { supabase, Child } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function AvailableChildren() {
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    loadChildren();
  }, []);

  const loadChildren = async () => {
    try {
      const { data, error } = await supabase
        .from('children')
        .select('*')
        .eq('is_sponsored', false)
        .order('created_at', { ascending: false });

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

  const handleSponsor = async (childId: string) => {
    if (!user) {
      navigate('/signup');
      return;
    }

    try {
      const { error } = await supabase
        .from('sponsorships')
        .insert([
          {
            child_id: childId,
            sponsor_id: user.id,
            status: 'Active',
            monthly_amount: 35,
          },
        ]);

      if (error) throw error;

      await supabase
        .from('children')
        .update({ is_sponsored: true })
        .eq('id', childId);

      navigate('/dashboard');
    } catch (error: any) {
      alert(error.message || 'Failed to create sponsorship');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link to="/" className="flex items-center space-x-2">
              <BookOpen className="w-8 h-8 text-red-600" />
              <span className="text-2xl font-bold text-gray-900">Promesas English Academy</span>
            </Link>
            <div className="flex items-center space-x-4">
              {user ? (
                <Link
                  to="/dashboard"
                  className="bg-red-600 text-white px-6 py-2.5 rounded-lg hover:bg-red-700 transition font-medium"
                >
                  {t.common.dashboard}
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-gray-700 hover:text-red-600 font-medium transition"
                  >
                    {t.common.signIn}
                  </Link>
                  <Link
                    to="/signup"
                    className="bg-red-600 text-white px-6 py-2.5 rounded-lg hover:bg-red-700 transition font-medium"
                  >
                    {t.common.signUp}
                  </Link>
                </>
              )}
              <button
                onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
                className="flex items-center text-gray-700 hover:text-red-600 font-medium transition"
                title={language === 'en' ? 'Cambiar a Español' : 'Switch to English'}
              >
                <Languages className="w-5 h-5 mr-1" />
                {language === 'en' ? 'ES' : 'EN'}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {t.children.waitingTitle}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {t.children.waitingSubtitle}
          </p>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
            <p className="mt-4 text-gray-600">{t.children.loadingChildren}</p>
          </div>
        ) : children.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-xl text-gray-600">
              {t.children.allSponsored}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {children.map((child) => (
              <div
                key={child.id}
                className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition overflow-hidden group"
              >
                <div className="aspect-[4/3] overflow-hidden bg-gray-200">
                  {child.photo_url ? (
                    <img
                      src={child.photo_url}
                      alt={`${child.first_name} ${child.last_name}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Heart className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {child.first_name} {child.last_name}
                  </h3>

                  <div className="flex items-center text-gray-600 mb-3">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span className="text-sm">{child.location}</span>
                  </div>

                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                    <span>{calculateAge(child.birthdate)} {t.children.yearsOld}</span>
                    <span>•</span>
                    <span>{child.gender === 'Male' ? t.children.male : t.children.female}</span>
                  </div>

                  <p className="text-gray-700 mb-4 line-clamp-3 leading-relaxed">
                    {child.bio || 'This child is eager to learn English and needs your support.'}
                  </p>

                  <div className="flex items-center justify-between mb-4 text-sm">
                    <div>
                      <span className="text-gray-600">{t.children.englishLevel}:</span>
                      <span className="ml-2 font-semibold text-red-600">
                        {child.english_level}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">{t.common.status}:</span>
                      <span className="ml-2 font-semibold text-gray-900">
                        {child.program_status}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSponsor(child.id)}
                    className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition font-semibold flex items-center justify-center"
                  >
                    <Heart className="w-5 h-5 mr-2" />
                    {t.children.sponsorChild} {child.first_name}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
