import { useNavigate } from '../hooks/useNavigate';
import { ArrowLeft } from 'lucide-react';

export default function Terms() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-8 py-12">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms & Conditions</h1>

        <div className="bg-white rounded-lg shadow-sm p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">PLATFORM TERMS AND CONDITIONS</h2>
          </section>

          <section>
            <h3 className="text-xl font-bold text-gray-900 mb-3">About Us</h3>
            <p className="text-gray-700 leading-relaxed">
              Welcome to DyslyzeML. By accessing or using this screening tool, you agree to comply with and be bound by these Terms and Conditions. Please read them carefully before using the service.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Use of the Tool</h3>
            <p className="text-gray-700 leading-relaxed mb-3">
              DyslyzeML is designed for preliminary screening of dyslexia and is not a substitute for professional medical diagnosis or advice. Users should not rely solely on DyslyzeML for medical or educational decisions. The tool is intended for use by educators, clinicians, parents, and individuals seeking preliminary assessment.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-bold text-gray-900 mb-3">User Responsibilities</h3>
            <p className="text-gray-700 leading-relaxed mb-3">
              Users must provide accurate and truthful information when using the tool. Unauthorized use, reproduction, or distribution of the tool or its content is prohibited. Users agree not to use the tool for any unlawful or harmful purposes.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Data Privacy and Security</h3>
            <p className="text-gray-700 leading-relaxed mb-3">
              DyslyzeML respects user privacy and handles all personal data according to applicable data protection laws. Collected data will be used solely for the purpose of screening and improving the tool. Users have the right to access, modify, or request deletion of their data by contacting the support team.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Intellectual Property</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>All intellectual property rights related to DyslyzeML, including software, content, and trademarks, are owned by the developers or licensed parties.</li>
              <li>No part of the tool may be copied, modified, or distributed without explicit permission.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Limitation of Liability</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>DyslyzeML is provided "as is" without warranties of any kind.</li>
              <li>The developers disclaim any liability for damages resulting from the use or inability to use the tool.</li>
              <li>Users assume full responsibility for decisions made based on the screening results.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Changes to Terms</h3>
            <p className="text-gray-700 leading-relaxed">
              These Terms and Conditions may be updated from time to time. Continued use of the tool after changes constitute acceptance of the revised terms.
            </p>
          </section>

          <div className="pt-8 border-t border-gray-200">
            <button
              onClick={() => navigate('register')}
              className="px-8 py-3 bg-cyan-400 text-white rounded-lg hover:bg-cyan-500 transition-colors font-medium"
            >
              I Agree - Go to Registration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
