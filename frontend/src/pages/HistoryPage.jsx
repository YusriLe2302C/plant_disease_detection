import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, TrendingUp, ChevronLeft, ChevronRight, Eye, Trash2 } from 'lucide-react';
import { getHistory, deleteScan } from '../utils/api';
import Loading from '../components/Loading';
import AnimatedBackground from '../components/AnimatedBackground';

const HistoryPage = () => {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalScans, setTotalScans] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchHistory();
  }, [page]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await getHistory(page, 12);
      setScans(response.data.scans || []);
      setTotalPages(response.data.pagination?.total_pages || 1);
      setTotalScans(response.data.pagination?.total || 0);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e, scanId) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this scan?')) {
      try {
        await deleteScan(scanId);
        fetchHistory();
      } catch (error) {
        console.error('Failed to delete scan:', error);
        alert('Failed to delete scan');
      }
    }
  };

  return (
    <div className="relative min-h-screen">
      <AnimatedBackground />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        <div className="text-center mb-12">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4 text-gray-900">
            <span className="gradient-text">Scan History</span>
          </h1>
          <p className="text-gray-700">View all your previous plant disease detections</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {[
            { icon: Calendar, label: 'Total Scans', value: totalScans },
            { icon: TrendingUp, label: 'This Month', value: scans.filter(s => new Date(s.timestamp) > new Date(Date.now() - 30*24*60*60*1000)).length },
            { icon: Eye, label: 'Diseases Found', value: scans.filter(s => !s.disease?.toLowerCase().includes('healthy')).length },
          ].map((stat, index) => (
            <div key={index} className="glass rounded-2xl p-6 flex items-center space-x-4 card-shadow">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <stat.icon className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {loading ? (
          <Loading text="Loading history..." />
        ) : scans.length === 0 ? (
          <div className="glass rounded-3xl p-12 text-center card-shadow">
            <div className="w-20 h-20 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-6">
              <Calendar className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900">No scans yet</h3>
            <p className="text-gray-600 mb-6">Upload your first plant image to get started</p>
            <button
              onClick={() => navigate('/upload')}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:scale-105 transition-all shadow-lg"
            >
              Upload Image
            </button>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {scans.map((scan) => {
                const isHealthy = scan.disease?.toLowerCase().includes('healthy');
                return (
                  <div
                    key={scan._id}
                    className="glass glass-hover rounded-2xl overflow-hidden group cursor-pointer card-shadow"
                    onClick={() => navigate(`/result`, { state: { result: scan } })}
                  >
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={scan.image_url ? `http://localhost:5000${scan.image_url}` : 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop'}
                        alt={scan.disease}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop';
                        }}
                      />
                      <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm shadow-lg ${
                        isHealthy ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                      }`}>
                        {isHealthy ? 'Healthy' : 'Disease'}
                      </div>
                      <button
                        onClick={(e) => handleDelete(e, scan._id)}
                        className="absolute top-3 left-3 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
                      >
                        <Trash2 className="w-4 h-4 text-white" />
                      </button>
                    </div>
                    
                    <div className="p-6">
                      <h3 className="font-semibold text-lg mb-2 truncate text-gray-900">{scan.disease || 'Unknown'}</h3>
                      <div className="flex items-center justify-between text-sm mb-3">
                        <span className="text-gray-600">Confidence</span>
                        <span className="font-semibold text-green-600">
                          {Math.round((scan.confidence || 0) * 100)}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden mb-3">
                        <div
                          className="h-full bg-gradient-to-r from-green-500 to-emerald-600"
                          style={{ width: `${(scan.confidence || 0) * 100}%` }}
                        />
                      </div>
                      <div className="flex items-center text-xs text-gray-500">
                        <Calendar className="w-3 h-3 mr-1" />
                        {new Date(scan.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-4 mt-12">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-10 h-10 glass glass-hover rounded-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed text-gray-700"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                <span className="text-gray-700 font-medium">
                  Page {page} of {totalPages}
                </span>
                
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="w-10 h-10 glass glass-hover rounded-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed text-gray-700"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;
