import { Github, Linkedin, Mail, Leaf } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="glass border-t border-green-200/50 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="font-display text-lg font-bold gradient-text">AgroDetect AI</span>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              Advanced plant disease detection system combining computer vision, IoT sensors, and deep learning to help farmers protect their crops and increase yields.
            </p>
            <p className="text-xs text-gray-500">
              Built with EfficientNet architecture and trained on extensive agricultural datasets. For research and educational purposes.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Resources</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><a href="#" className="hover:text-green-600 transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-green-600 transition-colors">API Reference</a></li>
              <li><a href="#" className="hover:text-green-600 transition-colors">Research Papers</a></li>
              <li><a href="#" className="hover:text-green-600 transition-colors">Dataset Info</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Connect</h3>
            <div className="flex space-x-3 mb-4">
              <a href="#" className="w-10 h-10 rounded-lg glass glass-hover flex items-center justify-center">
                <Github className="w-5 h-5 text-gray-700" />
              </a>
              <a href="#" className="w-10 h-10 rounded-lg glass glass-hover flex items-center justify-center">
                <Linkedin className="w-5 h-5 text-gray-700" />
              </a>
              <a href="#" className="w-10 h-10 rounded-lg glass glass-hover flex items-center justify-center">
                <Mail className="w-5 h-5 text-gray-700" />
              </a>
            </div>
            <p className="text-xs text-gray-500">
              Contact us for collaborations or agricultural AI research inquiries.
            </p>
          </div>
        </div>

        <div className="border-t border-green-200/50 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-600 space-y-2 md:space-y-0">
            <p>&copy; 2024 AgroDetect AI. All rights reserved.</p>
            <div className="flex space-x-6">
              <a href="#" className="hover:text-green-600 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-green-600 transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-green-600 transition-colors">Disclaimer</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
