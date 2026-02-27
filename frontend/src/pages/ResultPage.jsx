import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import anime from 'animejs';
import { CheckCircle2, AlertCircle, Clock, Cpu, ArrowLeft, Download } from 'lucide-react';
import AnimatedBackground from '../components/AnimatedBackground';
import { jsPDF } from 'jspdf';

const ResultPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const result = location.state?.result;
  const containerRef = useRef(null);
  const confidenceRef = useRef(null);

  const confidenceValue =
    result?.confidence_percent ??
    (result?.confidence ? result.confidence * 100 : 0);
  const formattedDate = result?.timestamp
    ? new Date(result.timestamp).toLocaleString()
    : new Date().toLocaleString();
  const severityValue =
    result?.severity_percent ??
    result?.ai_analysis?.severity ??
    'N/A';

  useEffect(() => {
    if (!result) {
      navigate('/upload');
      return;
    }

    const timeline = anime.timeline({
      easing: 'easeOutExpo',
    });

    timeline
      .add({
        targets: containerRef.current,
        opacity: [0, 1],
        translateY: [50, 0],
        duration: 800,
      })
      .add({
        targets: confidenceRef.current,
        innerHTML: [0, Math.round(confidenceValue)],
        duration: 1500,
        round: 1,
      }, '-=400');
  }, [result, navigate, confidenceValue]);

  if (!result) return null;

  const isHealthy = result.disease?.toLowerCase().includes('healthy');
  const downloadPDF = async () => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPos = 20;

    // Header
    pdf.setFillColor(34, 197, 94);
    pdf.rect(0, 0, pageWidth, 40, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text('AgroDetect AI', pageWidth / 2, 20, { align: 'center' });
    pdf.setFontSize(12);
    pdf.text('Plant Disease Analysis Report', pageWidth / 2, 30, { align: 'center' });

    yPos = 50;
    pdf.setTextColor(0, 0, 0);

    // Add image
    if (result.image_url) {
      try {
        const imgUrl = `http://localhost:5000${result.image_url}`;
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = imgUrl;
        });

        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const imgData = canvas.toDataURL('image/jpeg');

        const imgWidth = 80;
        const imgHeight = (img.height / img.width) * imgWidth;
        pdf.addImage(imgData, 'JPEG', (pageWidth - imgWidth) / 2, yPos, imgWidth, imgHeight);
        yPos += imgHeight + 10;
        if (yPos > pageHeight - 40) {
          pdf.addPage();
          yPos = 20;
        }
      } catch (err) {
        console.error('Image load failed:', err);
      }
    }

    // Analysis Details
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Analysis Details', 20, yPos);
    yPos += 10;

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Date: ${formattedDate}`, 20, yPos);
    yPos += 7;
    pdf.text(`Disease: ${result.disease}`, 20, yPos);
    yPos += 7;
    pdf.text(`Confidence: ${confidenceValue.toFixed(1)}%`, 20, yPos);
    yPos += 7;
    pdf.text(`Severity: ${severityValue}`, 20, yPos);
    yPos += 7;
    pdf.text(`Model: ${result.model}`, 20, yPos);
    yPos += 7;
    pdf.text(`Processing Time: ${result.processing_time}s`, 20, yPos);
    yPos += 12;

    // Summary
    if (result.ai_analysis?.summary) {
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Summary', 20, yPos);
      yPos += 8;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const summaryLines = pdf.splitTextToSize(result.ai_analysis.summary, pageWidth - 40);
      pdf.text(summaryLines, 20, yPos);
      yPos += summaryLines.length * 5 + 8;
    }

    // Actions
    if (result.ai_analysis?.actions?.length > 0) {
      if (yPos > pageHeight - 60) {
        pdf.addPage();
        yPos = 20;
      }
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Immediate Actions', 20, yPos);
      yPos += 8;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      result.ai_analysis.actions.forEach((action, i) => {
        const lines = pdf.splitTextToSize(`${i + 1}. ${action}`, pageWidth - 40);
        if (yPos + lines.length * 5 > pageHeight - 20) {
          pdf.addPage();
          yPos = 20;
        }
        pdf.text(lines, 20, yPos);
        yPos += lines.length * 5 + 3;
      });
      yPos += 5;
    }

    // Prevention
    if (result.ai_analysis?.prevention?.length > 0) {
      if (yPos > pageHeight - 60) {
        pdf.addPage();
        yPos = 20;
      }
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Prevention Measures', 20, yPos);
      yPos += 8;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      result.ai_analysis.prevention.forEach((prev, i) => {
        const lines = pdf.splitTextToSize(`${i + 1}. ${prev}`, pageWidth - 40);
        if (yPos + lines.length * 5 > pageHeight - 20) {
          pdf.addPage();
          yPos = 20;
        }
        pdf.text(lines, 20, yPos);
        yPos += lines.length * 5 + 3;
      });
    }

    // Footer
    const totalPages = pdf.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(128, 128, 128);
      pdf.text(
        'This AI-generated report provides preliminary disease detection. Consult certified agricultural experts for critical decisions.',
        pageWidth / 2,
        pageHeight - 15,
        { align: 'center', maxWidth: pageWidth - 40 }
      );
      pdf.text(`Generated by AgroDetect AI | Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    }

    pdf.save(`AgroDetect-Report-${result.disease}-${Date.now()}.pdf`);
  };

  return (
    <div className="relative min-h-screen">
      <AnimatedBackground />
      
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        <button
          onClick={() => navigate('/upload')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors font-medium"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Upload</span>
        </button>

        <div ref={containerRef} className="opacity-0">
          <div className="text-center mb-12">
            <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full mb-4 shadow-lg ${
              isHealthy ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {isHealthy ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <span className="font-semibold">{isHealthy ? 'Healthy Plant' : 'Disease Detected'}</span>
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold gradient-text mb-4">
              Analysis Complete
            </h1>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div className="glass rounded-3xl p-8 card-shadow">
              <div className="relative rounded-2xl overflow-hidden mb-6 group shadow-xl">
                <img
                  src={result.image_url 
                    ? `http://localhost:5000${result.image_url}` 
                    : 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=600&fit=crop'
                  }
                  alt="Analyzed plant"
                  className="w-full h-96 object-cover"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=600&fit=crop';
                  }}
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <p className="text-white font-semibold">Analyzed Image</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="glass rounded-3xl p-8 card-shadow">
                <h2 className="text-2xl font-bold mb-6 text-gray-900">Detection Results</h2>
                
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-600">Disease</span>
                      <span className="font-semibold text-xl text-gray-900">{result.disease || 'Unknown'}</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-600">Confidence</span>
                      <span className="font-semibold text-3xl gradient-text">
                        <span ref={confidenceRef}>0</span>%
                      </span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-600 transition-all duration-1000"
                        style={{ width: `${confidenceValue}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-600">Processing Time</div>
                        <div className="font-semibold text-gray-900">{result.processing_time || '2.3'}s</div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                        <Cpu className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-600">Model</div>
                        <div className="font-semibold text-gray-900">{result.model || 'EfficientNet'}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass rounded-3xl p-8 card-shadow">
                <h3 className="font-semibold text-lg mb-4 text-gray-900">AI Analysis & Recommendations</h3>
                {result.ai_analysis ? (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-sm text-gray-700 mb-2">Summary</h4>
                      <p className="text-sm text-gray-600">{result.ai_analysis.summary}</p>
                    </div>
                    
                    {result.ai_analysis.actions && result.ai_analysis.actions.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm text-gray-700 mb-2">Immediate Actions</h4>
                        <ul className="space-y-2">
                          {result.ai_analysis.actions.map((action, idx) => (
                            <li key={idx} className="flex items-start space-x-2 text-sm text-gray-600">
                              <AlertCircle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                              <span>{action}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {result.ai_analysis.prevention && result.ai_analysis.prevention.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm text-gray-700 mb-2">Prevention Tips</h4>
                        <ul className="space-y-2">
                          {result.ai_analysis.prevention.map((tip, idx) => (
                            <li key={idx} className="flex items-start space-x-2 text-sm text-gray-600">
                              <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <ul className="space-y-3 text-sm text-gray-700">
                    {isHealthy ? (
                      <>
                        <li className="flex items-start space-x-2">
                          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <span>Plant appears healthy. Continue regular care and monitoring.</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <span>Maintain proper watering schedule and soil nutrition.</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <span>Monitor regularly for early signs of stress or disease.</span>
                        </li>
                      </>
                    ) : (
                      <>
                        <li className="flex items-start space-x-2">
                          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                          <span>Isolate affected plants to prevent disease spread to healthy crops.</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                          <span>Remove and dispose of severely infected leaves properly.</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                          <span>Consult agricultural extension services for treatment options.</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                          <span>Consider organic treatments before chemical pesticides when possible.</span>
                        </li>
                      </>
                    )}
                  </ul>
                )}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Note: These are general recommendations. For specific treatment plans, please consult with certified agricultural professionals or local extension services.
                  </p>
                </div>
              </div>
              <button 
                onClick={downloadPDF}
                className="w-full py-3 glass glass-hover rounded-xl flex items-center justify-center space-x-2 text-gray-700 font-medium"
              >
                <Download className="w-5 h-5" />
                <span>Download PDF Report</span>
              </button>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => navigate('/upload')}
              className="flex-1 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:scale-105 transition-all glow-green shadow-xl"
            >
              Analyze Another Image
            </button>
            <button
              onClick={() => navigate('/history')}
              className="flex-1 py-4 glass glass-hover rounded-xl font-semibold text-gray-700"
            >
              View History
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultPage;
