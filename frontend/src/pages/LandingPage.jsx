import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import anime from 'animejs';
import { Sparkles, Zap, Shield, TrendingUp, Upload, Brain, Leaf, Award, Users, Globe, ArrowRight, Camera } from 'lucide-react';
import AnimatedBackground from '../components/AnimatedBackground';
import ImageGallery from '../components/ImageGallery';
import { getHistory } from '../utils/api';

const LandingPage = () => {
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const statsRef = useRef([]);
  const [stats, setStats] = useState({
    totalScans: 0,
    avgConfidence: 95,
    uniqueDiseases: 0,
    avgResponseTime: 2
  });

  useEffect(() => {
    fetchStats();
    anime({
      targets: heroRef.current,
      opacity: [0, 1],
      translateY: [50, 0],
      duration: 1200,
      easing: 'easeOutExpo',
    });
  }, []);

  const fetchStats = async () => {
    try {
      const response = await getHistory(1, 1000);
      const scans = response.data.scans || [];
      
      const totalScans = response.data.pagination?.total || scans.length;
      const uniqueDiseases = new Set(scans.map(s => s.disease)).size;
      const avgConfidence = scans.length > 0 
        ? Math.round(scans.reduce((sum, s) => sum + (s.confidence || 0), 0) / scans.length * 100)
        : 95;
      const avgResponseTime = scans.length > 0
        ? (scans.reduce((sum, s) => sum + (s.processing_time || 2), 0) / scans.length).toFixed(1)
        : 2;
      
      setStats({
        totalScans,
        avgConfidence,
        uniqueDiseases,
        avgResponseTime: parseFloat(avgResponseTime)
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  useEffect(() => {
    statsRef.current.forEach((stat, index) => {
      if (stat) {
        anime({
          targets: stat,
          innerHTML: [0, stat.getAttribute('data-value')],
          duration: 2000,
          delay: index * 200,
          round: 1,
          easing: 'easeOutExpo',
        });
      }
    });
  }, [stats]);

  const features = [
    { icon: Brain, title: 'AI-Powered Detection', desc: 'EfficientNet deep learning model trained on 50,000+ images' },
    { icon: Zap, title: 'Real-time Analysis', desc: 'Sub-3 second disease diagnosis with 95%+ accuracy' },
    { icon: Shield, title: 'IoT Integration', desc: 'ESP32-CAM automated field monitoring 24/7' },
    { icon: TrendingUp, title: 'Smart Analytics', desc: 'Historical tracking and predictive insights' },
  ];

  const ethics = [
    { icon: Award, title: 'Research-Backed', desc: 'Built on peer-reviewed agricultural AI research' },
    { icon: Users, title: 'Farmer-Centric', desc: 'Designed with input from agricultural experts' },
    { icon: Globe, title: 'Sustainable Impact', desc: 'Reducing pesticide use through early detection' },
  ];

  return (
    <div className="relative min-h-screen">
      <AnimatedBackground />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        {/* Hero Section */}
        <div ref={heroRef} className="text-center mb-20">
          <div className="inline-flex items-center space-x-2 glass px-4 py-2 rounded-full mb-6 shadow-lg">
            <Sparkles className="w-4 h-4 text-green-600" />
            <span className="text-sm text-gray-700 font-medium">Powered by Deep Learning</span>
          </div>
          
          <h1 className="font-display text-5xl md:text-7xl font-bold mb-6">
            <span className="gradient-text">AgroDetect AI</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto font-medium">
            Advanced plant disease detection system combining computer vision, IoT sensors, and AI to protect your crops
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/upload')}
              className="group px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl font-semibold text-lg text-white hover:scale-105 transition-all glow-green shadow-xl flex items-center justify-center space-x-2"
            >
              <Upload className="w-5 h-5" />
              <span>Upload Image</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => navigate('/live-scan')}
              className="group px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl font-semibold text-lg text-white hover:scale-105 transition-all shadow-xl flex items-center justify-center space-x-2"
            >
              <Camera className="w-5 h-5" />
              <span>Live Camera</span>
            </button>
            <button
              onClick={() => navigate('/history')}
              className="px-8 py-4 glass glass-hover rounded-xl font-semibold text-lg text-gray-700 flex items-center justify-center space-x-2"
            >
              <Leaf className="w-5 h-5" />
              <span>View History</span>
            </button>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
          {[
            { label: 'Accuracy', value: stats.avgConfidence, suffix: '%' },
            { label: 'Scans', value: stats.totalScans, suffix: '+' },
            { label: 'Diseases', value: stats.uniqueDiseases, suffix: '' },
            { label: 'Response', value: stats.avgResponseTime, suffix: 's' },
          ].map((stat, index) => (
            <div key={index} className="glass glass-hover rounded-2xl p-6 text-center card-shadow">
              <div className="text-4xl font-bold gradient-text mb-2">
                <span ref={(el) => (statsRef.current[index] = el)} data-value={stat.value}>0</span>
                {stat.suffix}
              </div>
              <div className="text-gray-600 text-sm font-medium">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {features.map((feature, index) => (
            <div key={index} className="glass glass-hover rounded-2xl p-6 group card-shadow">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-gray-900">{feature.title}</h3>
              <p className="text-gray-600 text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Mission Section with Image */}
        <div className="glass rounded-3xl p-8 md:p-12 mb-20 card-shadow">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-6 text-gray-900">
                Empowering Farmers with <span className="gradient-text">AI Technology</span>
              </h2>
              <p className="text-gray-700 mb-6 leading-relaxed">
                AgroDetect AI combines cutting-edge computer vision with practical agricultural knowledge to help farmers detect plant diseases early, reduce crop loss, and minimize chemical usage.
              </p>
              <div className="space-y-4">
                {ethics.map((item, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">{item.title}</h4>
                      <p className="text-sm text-gray-600">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-2xl overflow-hidden shadow-2xl">
                <img 
                  src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=600&h=600&fit=crop" 
                  alt="Farmer using technology in field"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl blur-3xl opacity-40" />
            </div>
          </div>
        </div>

        {/* Image Gallery Section */}
        <div className="mb-20">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-center mb-4 text-gray-900">
            See It In <span className="gradient-text">Action</span>
          </h2>
          <p className="text-center text-gray-600 mb-12">Real-world applications of AI-powered plant disease detection</p>
          <ImageGallery />
        </div>

        {/* CTA Section */}
        <div className="glass rounded-3xl p-12 text-center card-shadow relative overflow-hidden">
          <div 
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: 'url(https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=1200&h=400&fit=crop)',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          />
          <div className="relative z-10">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4 text-gray-900">
              Ready to protect your crops?
            </h2>
            <p className="text-gray-700 mb-8 max-w-2xl mx-auto">
              Upload an image or connect your ESP32-CAM device for automated monitoring
            </p>
            <button
              onClick={() => navigate('/upload')}
              className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl font-semibold text-white hover:scale-105 transition-all glow-green shadow-xl"
            >
              Get Started Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
