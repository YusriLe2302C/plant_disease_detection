import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import anime from 'animejs';
import { Upload, Image as ImageIcon, X, Loader2, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { uploadImage } from '../utils/api';
import AnimatedBackground from '../components/AnimatedBackground';

const UploadPage = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const navigate = useNavigate();
  const uploadRef = useRef(null);
  const progressRef = useRef(null);

  useEffect(() => {
    anime({
      targets: uploadRef.current,
      opacity: [0, 1],
      translateY: [30, 0],
      duration: 800,
      easing: 'easeOutExpo',
    });
  }, []);

  useEffect(() => {
    if (loading && progressRef.current) {
      anime({
        targets: progressRef.current,
        width: `${progress}%`,
        duration: 300,
        easing: 'easeOutQuad',
      });
    }
  }, [progress, loading]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFile = (selectedFile) => {
    if (selectedFile && selectedFile.type.startsWith('image/')) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = async () => {
    if (!file) return;

    setLoading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append('image', file);

    const progressInterval = setInterval(() => {
      setProgress((prev) => (prev < 90 ? prev + 10 : prev));
    }, 200);

    try {
      const response = await uploadImage(formData);
      setProgress(100);
      clearInterval(progressInterval);
      
      setTimeout(() => {
        navigate('/result', { state: { result: response.data } });
      }, 500);
    } catch (error) {
      clearInterval(progressInterval);
      setLoading(false);
      alert('Upload failed: ' + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div className="relative min-h-screen">
      <AnimatedBackground />
      
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        <div ref={uploadRef}>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-center mb-4 text-gray-900">
            <span className="gradient-text">Upload Plant Image</span>
          </h1>
          <p className="text-center text-gray-700 mb-8">
            Upload a clear image of the plant leaf for AI-powered disease detection
          </p>

          <div className="glass rounded-2xl p-6 mb-8 card-shadow">
            <div className="flex items-start space-x-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-700">
                <p className="font-semibold mb-2">Best Practices for Accurate Detection:</p>
                <ul className="space-y-1 text-gray-600">
                  <li>• Use natural daylight for clear visibility</li>
                  <li>• Capture close-up images of affected leaves</li>
                  <li>• Ensure the leaf fills most of the frame</li>
                  <li>• Avoid blurry or low-resolution images</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="glass rounded-3xl p-8 md:p-12 card-shadow">
            {!preview ? (
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
                  dragActive
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-300 hover:border-green-400 bg-white/50'
                }`}
              >
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-6 shadow-lg">
                    <Upload className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Drop your image here</h3>
                  <p className="text-gray-600 mb-6">or click to browse</p>
                  <label className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold cursor-pointer hover:scale-105 transition-all shadow-lg">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFile(e.target.files[0])}
                      className="hidden"
                    />
                    Select Image
                  </label>
                </div>
              </div>
            ) : (
              <div>
                <div className="relative rounded-2xl overflow-hidden mb-6 shadow-xl">
                  <img src={preview} alt="Preview" className="w-full h-96 object-cover" />
                  <button
                    onClick={() => {
                      setFile(null);
                      setPreview(null);
                    }}
                    className="absolute top-4 right-4 w-10 h-10 bg-red-500 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                    <p className="text-sm text-white font-medium">Image ready for analysis</p>
                  </div>
                </div>

                {loading ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-700 font-medium">Analyzing image...</span>
                      <span className="text-green-600 font-semibold">{progress}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        ref={progressRef}
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-600"
                        style={{ width: '0%' }}
                      />
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handleSubmit}
                    className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold text-lg hover:scale-105 transition-all glow-green shadow-xl flex items-center justify-center space-x-2"
                  >
                    <ImageIcon className="w-5 h-5" />
                    <span>Analyze Image</span>
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="mt-8 grid md:grid-cols-3 gap-4">
            {[
              { icon: CheckCircle2, text: '95%+ accuracy rate', color: 'green' },
              { icon: Loader2, text: 'Results in 2-3 seconds', color: 'blue' },
              { icon: ImageIcon, text: 'JPG, PNG supported', color: 'purple' },
            ].map((item, index) => (
              <div key={index} className="glass rounded-xl p-4 flex items-center space-x-3 card-shadow">
                <item.icon className={`w-5 h-5 text-${item.color}-600`} />
                <span className="text-sm text-gray-700 font-medium">{item.text}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 glass rounded-2xl p-6 card-shadow">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-600">
                <p className="font-semibold text-gray-900 mb-1">Disclaimer</p>
                <p>This AI system provides preliminary disease detection. For critical decisions, please consult with certified agricultural experts or plant pathologists.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadPage;
