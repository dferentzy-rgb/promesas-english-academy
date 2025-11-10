import { Link } from 'react-router-dom';
import { BookOpen, LogOut, LayoutDashboard, Users, MessageCircle, Languages } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { profile, signOut } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const isAdmin = profile?.role === 'admin';

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <Link to={isAdmin ? '/admin' : '/dashboard'} className="flex items-center space-x-2">
              <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" />
              <span className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">Promesas</span>
            </Link>

            <div className="flex items-center space-x-1">
              {isAdmin ? (
                <>
                  <Link
                    to="/admin"
                    className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition"
                  >
                    <LayoutDashboard className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="font-medium text-sm sm:text-base hidden sm:inline">{t.common.dashboard}</span>
                  </Link>
                  <Link
                    to="/admin/children"
                    className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition"
                  >
                    <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="font-medium text-sm sm:text-base hidden sm:inline">{t.common.children}</span>
                  </Link>
                  <Link
                    to="/admin/messages"
                    className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition"
                  >
                    <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="font-medium text-sm sm:text-base hidden sm:inline">{t.common.messages}</span>
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/dashboard"
                    className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition"
                  >
                    <LayoutDashboard className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="font-medium text-sm sm:text-base hidden sm:inline">{t.common.dashboard}</span>
                  </Link>
                  <Link
                    to="/messages"
                    className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition"
                  >
                    <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="font-medium text-sm sm:text-base hidden sm:inline">{t.common.messages}</span>
                  </Link>
                </>
              )}

              <button
                onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
                className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition"
                title={language === 'en' ? 'Cambiar a Español' : 'Switch to English'}
              >
                <Languages className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="font-medium text-sm sm:text-base">{language === 'en' ? 'ES' : 'EN'}</span>
              </button>

              <div className="ml-2 sm:ml-4 pl-2 sm:pl-4 border-l border-gray-200 flex items-center space-x-2 sm:space-x-3">
                <div className="text-right hidden md:block">
                  <p className="text-sm font-medium text-gray-900">{profile?.full_name}</p>
                  <p className="text-xs text-gray-600 capitalize">{profile?.role}</p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
