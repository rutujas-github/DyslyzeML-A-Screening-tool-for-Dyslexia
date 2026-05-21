import { useNavigate } from '../hooks/useNavigate';
import { Brain, Users, Home, Briefcase } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
      <header className="flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-2">
          <Brain className="w-8 h-8 text-blue-600" />
          <span className="text-2xl font-bold text-gray-900">DyslyzeML</span>
        </div>
        <nav className="flex items-center gap-8">
          <a href="#about" className="text-gray-700 hover:text-blue-600 transition-colors">About Dyslexia</a>
          <a href="#screening" className="text-gray-700 hover:text-blue-600 transition-colors">Screening assessments</a>
          <button
            onClick={() => navigate('login')}
            className="px-4 py-2 text-gray-700 hover:text-blue-600 transition-colors font-medium"
          >
            LOGIN
          </button>
          <button
            onClick={() => navigate('register')}
            className="px-6 py-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors font-medium"
          >
            REGISTER
          </button>
        </nav>
      </header>

      <main>
        <section className="px-8 py-16 max-w-7xl mx-auto">
          <div className="grid grid-cols-2 gap-16 items-center">
            <div>
              <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
                DyslyzeML: A WebCam<br />Screening tool for Dyslexia
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                A multi-modal screening tool for dyslexia that will help in flagging early signs of Dyslexia in children.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => navigate('login')}
                  className="px-8 py-3 border-2 border-gray-900 text-gray-900 rounded-lg hover:bg-gray-900 hover:text-white transition-all font-medium"
                >
                  LOGIN
                </button>
                <button
                  onClick={() => navigate('register')}
                  className="px-8 py-3 bg-cyan-400 text-white rounded-lg hover:bg-cyan-500 transition-colors font-medium"
                >
                  GET STARTED
                </button>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="w-96 h-96 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full flex items-center justify-center">
                <div className="text-center">
                  <div className="w-48 h-48 bg-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Brain className="w-24 h-24 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-8 mt-24">
            <div className="text-center">
              <Users className="w-16 h-16 text-cyan-500 mx-auto mb-4" />
              <h3 className="text-4xl font-bold text-gray-900 mb-2">+20%</h3>
              <p className="text-xl font-semibold text-gray-700 mb-2">Prevalence</p>
              <p className="text-gray-600">Dyslexia affects up to 20% of the global population.</p>
            </div>
            <div className="text-center">
              <Home className="w-16 h-16 text-cyan-500 mx-auto mb-4" />
              <h3 className="text-4xl font-bold text-gray-900 mb-2">40-60%</h3>
              <p className="text-xl font-semibold text-gray-700 mb-2">Hereditary</p>
              <p className="text-gray-600">Dyslexia often runs in families with genetic components.</p>
            </div>
            <div className="text-center">
              <Briefcase className="w-16 h-16 text-cyan-500 mx-auto mb-4" />
              <h3 className="text-4xl font-bold text-gray-900 mb-2">70%</h3>
              <p className="text-xl font-semibold text-gray-700 mb-2">Early flagging</p>
              <p className="text-gray-600">Children benefit most from intervention during their early ages.</p>
            </div>
          </div>
        </section>

        <section id="about" className="px-8 py-16 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-4xl font-bold text-gray-900 mb-6">About DyslyzeML</h2>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Dyslexia is a common learning difference that affects reading, writing, and spelling. Early identification helps people with dyslexia reach their full potential.
                </p>
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">What is DyslyzeML?</h3>
                  <p className="text-gray-700 mb-4">
                    DyslyzeML is an innovative, AI-powered tool designed to screen for dyslexia using advanced handwriting and eye-tracking analysis.
                  </p>
                  <p className="text-gray-700">
                    It provides fast, accessible, and non-invasive assessments for early identification of reading difficulties. DyslyzeML empowers educators, clinicians, and families with actionable insights to support learning success.
                  </p>
                </div>
              </div>
              <div className="flex justify-center">
                <div className="w-96 h-96 bg-gradient-to-br from-orange-100 to-yellow-100 rounded-3xl flex items-center justify-center">
                  <Brain className="w-48 h-48 text-orange-500" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="screening" className="px-8 py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">Screening assessments</h2>

            <div className="space-y-8">
              <div className="bg-white rounded-2xl shadow-lg p-8 flex gap-8 items-center">
                <div className="w-64 h-48 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
                  <Brain className="w-24 h-24 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-3xl font-bold text-gray-900 mb-4">Eye Movement Tracking</h3>
                  <p className="text-gray-700 mb-4">
                    During reading or visual tasks, the tool tracks eye movements such as fixation, saccades, and reading patterns.
                  </p>
                  <p className="text-gray-700">
                    Anomalies in these movements can indicate challenges typical in dyslexia, offering another layer of assessment for early identification.
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-8 flex gap-8 items-center">
                <div className="w-64 h-48 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center">
                  <Brain className="w-24 h-24 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-3xl font-bold text-gray-900 mb-4">Handwriting Analysis</h3>
                  <p className="text-gray-700 mb-4">
                    During reading or visual tasks, the tool tracks eye movements such as fixation, saccades, and reading patterns.
                  </p>
                  <p className="text-gray-700">
                    Anomalies in these movements can indicate challenges typical in dyslexia, offering another layer of assessment for early identification.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
