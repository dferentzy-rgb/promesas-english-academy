import { Link } from 'react-router-dom';
import { Heart, BookOpen, Users, ArrowRight, Languages } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function Home() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="min-h-screen bg-white">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" />
              <span className="text-base sm:text-xl md:text-2xl font-bold text-gray-900">Promesas English Academy</span>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link
                to="/children"
                className="hidden sm:block text-gray-700 hover:text-red-600 font-medium transition text-sm md:text-base"
              >
                {t.nav.availableChildren}
              </Link>
              <Link
                to="/login"
                className="text-gray-700 hover:text-red-600 font-medium transition text-sm md:text-base"
              >
                {t.common.signIn}
              </Link>
              <button
                onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
                className="flex items-center text-gray-700 hover:text-red-600 font-medium transition text-sm md:text-base"
                title={language === 'en' ? 'Cambiar a Español' : 'Switch to English'}
              >
                <Languages className="w-4 h-4 sm:w-5 sm:h-5 mr-1" />
                <span className="hidden sm:inline">{language === 'en' ? 'ES' : 'EN'}</span>
              </button>
              <Link
                to="/signup"
                className="bg-red-600 text-white px-3 py-2 sm:px-6 sm:py-2.5 rounded-lg hover:bg-red-700 transition font-medium text-sm md:text-base"
              >
                <span className="hidden sm:inline">{t.nav.becomeASponsor}</span>
                <span className="sm:hidden">Sign Up</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <section className="relative bg-gradient-to-br from-red-600 via-red-700 to-red-800 text-white py-12 sm:py-20 md:py-24">
        <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/8466650/pexels-photo-8466650.jpeg')] bg-cover bg-center opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 leading-tight">
            {t.home.heroTitle}
            <br />
            {t.home.heroLocation}
          </h1>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-6 sm:mb-10 text-red-50 max-w-3xl mx-auto leading-relaxed">
            {t.home.heroSubtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Link
              to="/children"
              className="inline-flex items-center justify-center bg-white text-red-700 px-6 py-3 sm:px-8 sm:py-4 rounded-lg hover:bg-red-50 transition font-semibold text-base sm:text-lg shadow-lg"
            >
              {t.home.viewChildren}
              <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
            </Link>
            <Link
              to="/signup"
              className="inline-flex items-center justify-center bg-red-800 text-white px-6 py-3 sm:px-8 sm:py-4 rounded-lg hover:bg-red-900 transition font-semibold text-base sm:text-lg border-2 border-white"
            >
              {t.home.createAccount}
            </Link>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 md:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">{t.home.howItWorksTitle}</h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              {t.home.howItWorksSubtitle}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 sm:gap-8 md:gap-10">
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-red-100 rounded-full flex items-center justify-center mb-4 sm:mb-6">
                <Heart className="w-6 h-6 sm:w-7 sm:h-7 text-red-600" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">{t.home.step1Title}</h3>
              <p className="text-gray-600 leading-relaxed">
                {t.home.step1Text}
              </p>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-red-100 rounded-full flex items-center justify-center mb-4 sm:mb-6">
                <BookOpen className="w-6 h-6 sm:w-7 sm:h-7 text-red-600" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">{t.home.step2Title}</h3>
              <p className="text-gray-600 leading-relaxed">
                {t.home.step2Text}
              </p>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-red-100 rounded-full flex items-center justify-center mb-4 sm:mb-6">
                <Users className="w-6 h-6 sm:w-7 sm:h-7 text-red-600" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">{t.home.step3Title}</h3>
              <p className="text-gray-600 leading-relaxed">
                {t.home.step3Text}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-2xl sm:rounded-3xl p-8 sm:p-12 md:p-16 text-white text-center shadow-2xl">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">{t.home.aboutTitle}</h2>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-6 sm:mb-8 text-red-50 max-w-3xl mx-auto leading-relaxed">
              {t.home.aboutText1}
            </p>
            <p className="text-sm sm:text-base md:text-lg text-red-100 max-w-2xl mx-auto leading-relaxed">
              {t.home.aboutText2}
            </p>
          </div>
        </div>
      </section>

      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <BookOpen className="w-6 h-6 text-red-500" />
            <span className="text-xl font-bold text-white">Promesas English Academy</span>
          </div>
          <p className="text-sm">Quimistán, Honduras</p>
          <p className="text-sm mt-4">{t.home.footerTagline}</p>
        </div>
      </footer>
    </div>
  );
}
