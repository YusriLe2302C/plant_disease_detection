import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import anime from 'animejs';
import { CheckCircle2, AlertCircle, Clock, Cpu, ArrowLeft, Download, Microscope, Shield, Zap, Thermometer, Users, FileText, Volume2, VolumeX } from 'lucide-react';
import AnimatedBackground from '../components/AnimatedBackground';
import { jsPDF } from 'jspdf';

const ResultPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const result = location.state?.result;
  const containerRef = useRef(null);
  const confidenceRef = useRef(null);
  const [isReading, setIsReading] = useState(false);
  const [activeReadingCard, setActiveReadingCard] = useState(null);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en-IN');
  const [translatedCards, setTranslatedCards] = useState({});
  const [isTranslatingCards, setIsTranslatingCards] = useState({});

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

    setSpeechSupported('speechSynthesis' in window);
    setTranslatedCards((prev) => ({ ...prev, quickSummary: generateSummary() }));
    
    // Load voices
    if ('speechSynthesis' in window) {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        console.log('Available voices:', voices.map(v => `${v.name} (${v.lang})`));
      };
      
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
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
  
  const generateSummary = () => {
    return result.ai_analysis?.summary || `Analysis complete for ${result.disease || 'unknown condition'}. Confidence level: ${confidenceValue.toFixed(1)}%. ${result.ai_analysis?.actions?.length > 0 ? `Immediate actions recommended: ${result.ai_analysis.actions.slice(0, 3).join(', ')}.` : ''}`;
  };

  const languages = {
    'en-IN': 'English',
    'hi-IN': 'Hindi',
    'kn-IN': 'Kannada',
    'ta-IN': 'Tamil',
    'te-IN': 'Telugu',
    'ml-IN': 'Malayalam'
  };

  const langToCode = {
    'en-IN': 'en',
    'hi-IN': 'hi',
    'kn-IN': 'kn',
    'ta-IN': 'ta',
    'te-IN': 'te',
    'ml-IN': 'ml'
  };

  const getCardText = (cardKey) => {
    const fallbackActions = isHealthy
      ? [
          'Plant appears healthy. Continue regular care and monitoring.',
          'Maintain proper watering schedule and soil nutrition.',
          'Monitor regularly for early signs of stress or disease.',
        ]
      : [
          'Isolate affected plants to prevent disease spread to healthy crops.',
          'Remove and dispose of severely infected leaves properly.',
          'Consult agricultural extension services for treatment options.',
          'Consider organic treatments before chemical pesticides when possible.',
        ];

    switch (cardKey) {
      case 'quickSummary':
        return generateSummary();
      case 'detectionResults':
        return `Disease: ${result.disease || 'Unknown'}. Confidence: ${confidenceValue.toFixed(1)}%. Processing time: ${result.processing_time || '2.3'} seconds. Model: ${result.model || 'EfficientNet'}.`;
      case 'aiRecommendations': {
        const summary = result.ai_analysis?.summary || '';
        const actions = result.ai_analysis?.actions?.length
          ? result.ai_analysis.actions.join('. ')
          : fallbackActions.join('. ');
        const prevention = result.ai_analysis?.prevention?.length
          ? result.ai_analysis.prevention.join('. ')
          : '';
        return [summary, actions, prevention].filter(Boolean).join(' ');
      }
      case 'diseaseOverview':
        return `Pathogen: ${result.ai_analysis?.scientific_name || result.ai_analysis?.pathogen_type || 'Analysis in progress'}. Primary hosts: ${result.disease?.split('_')[0] || 'Various crops'}. Common name: ${result.disease?.replace(/_/g, ' ') || 'Unknown condition'}. Distribution: Worldwide occurrence in suitable climates.`;
      case 'symptoms':
        return `Visual indicators: ${(result.ai_analysis?.symptoms?.length ? result.ai_analysis.symptoms : ['Leaf discoloration and spotting', 'Wilting or yellowing patterns', 'Growth abnormalities', 'Tissue necrosis or lesions']).join('. ')}. Progression stages: Early minor discoloration. Moderate visible lesions. Advanced severe tissue damage. Critical plant death risk.`;
      case 'causes':
        return `Primary causes: ${(result.ai_analysis?.causes?.length ? result.ai_analysis.causes : ['Pathogenic organisms fungi bacteria viruses', 'Environmental stress factors', 'Nutrient deficiencies', 'Poor cultural practices']).join('. ')}. Environmental factors: ${(result.ai_analysis?.environmental_factors?.length ? result.ai_analysis.environmental_factors : ['High humidity over 80 percent', 'Temperature 20 to 30 degrees Celsius', 'Poor air circulation', 'Wet leaf surfaces']).join('. ')}.`;
      case 'riskAssessment':
        return `Severity level: ${confidenceValue > 80 ? 'High Risk' : confidenceValue > 60 ? 'Moderate Risk' : 'Low Risk'}. Spread risk: ${result.ai_analysis?.spread_risk || 'Moderate contagion potential'}. Urgency: ${confidenceValue > 80 ? 'Immediate action' : confidenceValue > 60 ? 'Within 7 days' : 'Monitor closely'}.`;
      case 'treatment':
        return `Immediate actions: ${(result.ai_analysis?.actions?.length ? result.ai_analysis.actions.slice(0, 4) : ['Fungicide applications', 'Bactericide treatments', 'Systemic pesticides', 'Follow label instructions']).join('. ')}. Treatment timeline: ${(result.ai_analysis?.treatment_timeline?.length ? result.ai_analysis.treatment_timeline : ['Immediate remove infected parts', '1 to 7 days begin treatment program', '2 to 4 weeks monitor and assess']).join('. ')}. Prevention methods: ${(result.ai_analysis?.prevention?.length ? result.ai_analysis.prevention.slice(0, 4) : ['Improve air circulation', 'Adjust watering practices', 'Remove infected material', 'Soil health management']).join('. ')}.`;
      case 'preventionProtection':
        return `Preventive measures: ${(result.ai_analysis?.prevention?.length ? result.ai_analysis.prevention : ['Use disease-resistant varieties', 'Implement crop rotation', 'Maintain proper plant spacing', 'Regular monitoring and inspection', 'Sanitize tools and equipment']).join('. ')}. Additional actions: ${(result.ai_analysis?.actions?.length > 4 ? result.ai_analysis.actions.slice(4) : ['Preventive fungicide programs', 'Environmental modifications', 'Quarantine new plants', 'Integrated pest management', 'Stress reduction techniques']).join('. ')}.`;
      case 'alternativeDiagnoses':
        return `Similar conditions to consider: ${(result.ai_analysis?.alternative_diagnoses?.length ? result.ai_analysis.alternative_diagnoses : ['Nutrient deficiency symptoms', 'Environmental stress damage', 'Other fungal infections', 'Viral disease manifestations', 'Insect damage patterns', 'Chemical burn effects']).join('. ')}.`;
      case 'disclaimer':
        return `This AI-powered analysis provides preliminary disease identification based on visual symptoms and should be considered supportive information only. Always consult certified plant pathologists, agricultural extension services, or qualified agronomists for definitive diagnosis and treatment recommendations. This technology assists and does not replace professional expertise. Date: ${formattedDate}. Disease: ${result.disease}. Confidence: ${confidenceValue.toFixed(1)} percent. Model: ${result.model}. Processing time: ${result.processing_time} seconds. Severity: ${severityValue}.`;
      default:
        return '';
    }
  };

  const translateCard = async (cardKey, language) => {
    const currentText = getCardText(cardKey);

    if (language === 'en-IN') {
      setTranslatedCards((prev) => ({ ...prev, [cardKey]: currentText }));
      return currentText;
    }

    setIsTranslatingCards((prev) => ({ ...prev, [cardKey]: true }));
    setTranslatedCards((prev) => ({ ...prev, [cardKey]: currentText }));

    try {
      const response = await fetch('http://localhost:5000/api/ollama/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: currentText,
          targetLanguage: languages[language],
        }),
      });

      if (!response.ok) {
        throw new Error('Translation failed');
      }

      const data = await response.json();
      const translatedText = data.translatedText || currentText;
      setTranslatedCards((prev) => ({ ...prev, [cardKey]: translatedText }));
      return translatedText;
    } catch (error) {
      console.error('Translation failed:', error);
      setTranslatedCards((prev) => ({ ...prev, [cardKey]: currentText }));
      return currentText;
    } finally {
      setIsTranslatingCards((prev) => ({ ...prev, [cardKey]: false }));
    }
  };

  const speakText = (text, language = 'en-IN', cardKey = null) => {
    if (!speechSupported) {
      return;
    }

    window.speechSynthesis.cancel();

    setTimeout(() => {
      const speech = new SpeechSynthesisUtterance(text);
      const langCode = langToCode[language] || 'en';

      speech.lang = langCode;
      speech.rate = 0.7;
      speech.pitch = 1;
      speech.volume = 1;

      speech.onstart = () => {
        setIsReading(true);
        setActiveReadingCard(cardKey);
      };

      speech.onend = () => {
        setIsReading(false);
        setActiveReadingCard(null);
      };

      speech.onerror = (error) => {
        console.error('Speech ERROR:', error);
        alert(`Speech failed: ${error.error}. Your browser may not support ${languages[language]} speech.`);
        setIsReading(false);
        setActiveReadingCard(null);
      };

      window.speechSynthesis.speak(speech);
    }, 100);
  };

  const readCard = async (cardKey) => {
    if (!speechSupported) {
      alert('Speech synthesis not supported in this browser');
      return;
    }

    if (isReading && activeReadingCard === cardKey) {
      speechSynthesis.cancel();
      setIsReading(false);
      setActiveReadingCard(null);
      return;
    }

    let textToSpeak = translatedCards[cardKey] || getCardText(cardKey);
    if (selectedLanguage !== 'en-IN' && !translatedCards[cardKey]) {
      textToSpeak = await translateCard(cardKey, selectedLanguage);
    }

    speakText(textToSpeak, selectedLanguage, cardKey);
  };

  const renderTranslationAndSpeakControls = (cardKey, showTranslatedBox = false) => (
    <div className="mb-4">
      {speechSupported && (
        <div className="flex items-center gap-3 mb-3">
          <select
            value={selectedLanguage}
            onChange={(e) => {
              const nextLanguage = e.target.value;
              setSelectedLanguage(nextLanguage);
              translateCard(cardKey, nextLanguage);
            }}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Object.entries(languages).map(([code, name]) => (
              <option key={code} value={code}>{name}</option>
            ))}
          </select>
          <button
            onClick={() => readCard(cardKey)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors"
          >
            {isReading && activeReadingCard === cardKey ? (
              <VolumeX className="w-4 h-4 text-blue-600" />
            ) : (
              <Volume2 className="w-4 h-4 text-blue-600" />
            )}
            <span className="text-sm text-blue-600">
              {isReading && activeReadingCard === cardKey ? 'Stop' : 'Listen'}
            </span>
          </button>
        </div>
      )}
      {showTranslatedBox && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-100">
          {isTranslatingCards[cardKey] ? (
            <div className="flex items-center space-x-2 text-gray-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span>Translating...</span>
            </div>
          ) : (
            <p className="text-gray-700 leading-relaxed">{translatedCards[cardKey] || getCardText(cardKey)}</p>
          )}
        </div>
      )}
    </div>
  );
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

          <div className="space-y-8 mb-8">
            <div className="glass rounded-3xl p-8 card-shadow">
              <div className="relative rounded-2xl overflow-hidden mb-6 group shadow-xl">
                <img
                  src={result.annotated_image
                    ? `data:image/jpeg;base64,${result.annotated_image}`
                    : result.image_url 
                      ? `http://localhost:5000${result.image_url}` 
                      : 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=600&fit=crop'
                  }
                  alt="Analyzed plant"
                  className="w-full h-[500px] object-cover"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=600&fit=crop';
                  }}
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <p className="text-white font-semibold">
                    {result.annotated_image ? 'YOLO Leaf Detection' : 'Original Image'}
                  </p>
                </div>
              </div>
              
              {/* {result.processed_image && (
                <div className="relative rounded-2xl overflow-hidden group shadow-xl">
                  <img
                    src={`data:image/jpeg;base64,${result.processed_image}`}
                    alt="YOLO processed leaf"
                    className="w-full h-64 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <p className="text-white font-semibold">YOLO Processed Leaf</p>
                  </div>
                </div>
              )} */}
            </div>

            <div className="space-y-6">
              {/* Summary Section */}              <div className="glass rounded-3xl p-8 card-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg text-gray-900">Quick Summary</h3>
                </div>
                {renderTranslationAndSpeakControls('quickSummary', true)}
              </div>

              <div className="glass rounded-3xl p-8 card-shadow">
                <h2 className="text-2xl font-bold mb-6 text-gray-900">Detection Results</h2>
                {renderTranslationAndSpeakControls('detectionResults', selectedLanguage !== 'en-IN')}
                
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
                {renderTranslationAndSpeakControls('aiRecommendations', selectedLanguage !== 'en-IN')}
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

          {/* Comprehensive Disease Information */}
          <div className="space-y-8">
            {/* Disease Overview */}
            <section className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <div className="flex items-center space-x-3 mb-6">
                <Microscope className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">Disease Overview</h2>
              </div>
              {renderTranslationAndSpeakControls('diseaseOverview', selectedLanguage !== 'en-IN')}
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-700 mb-3">Scientific Classification</h3>
                  <p className="text-gray-600 mb-4">Pathogen: {result.ai_analysis?.scientific_name || result.ai_analysis?.pathogen_type || 'Analysis in progress'}</p>
                  <h3 className="font-semibold text-gray-700 mb-2">Affected Crops</h3>
                  <p className="text-gray-600">Primary hosts: {result.disease?.split('_')[0] || 'Various crops'}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Common Names</h3>
                  <p className="text-gray-600 mb-4">{result.disease?.replace(/_/g, ' ') || 'Unknown condition'}</p>
                  <h3 className="font-semibold text-gray-700 mb-2">Distribution</h3>
                  <p className="text-gray-600">Worldwide occurrence in suitable climates</p>
                </div>
              </div>
            </section>

            {/* Symptoms */}
            <section className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <div className="flex items-center space-x-3 mb-6">
                <AlertCircle className="w-6 h-6 text-orange-600" />
                <h2 className="text-2xl font-bold text-gray-900">Symptoms & Identification</h2>
              </div>
              {renderTranslationAndSpeakControls('symptoms', selectedLanguage !== 'en-IN')}
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-700 mb-3">Visual Indicators</h3>
                  <ul className="space-y-2 text-gray-600">
                    {result.ai_analysis?.symptoms?.length > 0 ? (
                      result.ai_analysis.symptoms.map((symptom, idx) => (
                        <li key={idx}>• {symptom}</li>
                      ))
                    ) : (
                      <>
                        <li>• Leaf discoloration and spotting</li>
                        <li>• Wilting or yellowing patterns</li>
                        <li>• Growth abnormalities</li>
                        <li>• Tissue necrosis or lesions</li>
                      </>
                    )}
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-700 mb-3">Progression Stages</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• Early: Minor discoloration</li>
                    <li>• Moderate: Visible lesions</li>
                    <li>• Advanced: Severe tissue damage</li>
                    <li>• Critical: Plant death risk</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Causes & Environmental Conditions */}
            <section className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <div className="flex items-center space-x-3 mb-6">
                <Thermometer className="w-6 h-6 text-red-600" />
                <h2 className="text-2xl font-bold text-gray-900">Causes & Environmental Factors</h2>
              </div>
              {renderTranslationAndSpeakControls('causes', selectedLanguage !== 'en-IN')}
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-700 mb-3">Primary Causes</h3>
                  <ul className="space-y-2 text-gray-600">
                    {result.ai_analysis?.causes?.length > 0 ? (
                      result.ai_analysis.causes.map((cause, idx) => (
                        <li key={idx}>• {cause}</li>
                      ))
                    ) : (
                      <>
                        <li>• Pathogenic organisms (fungi, bacteria, viruses)</li>
                        <li>• Environmental stress factors</li>
                        <li>• Nutrient deficiencies</li>
                        <li>• Poor cultural practices</li>
                      </>
                    )}
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-700 mb-3">Environmental Factors</h3>
                  <ul className="space-y-2 text-gray-600">
                    {result.ai_analysis?.environmental_factors?.length > 0 ? (
                      result.ai_analysis.environmental_factors.map((factor, idx) => (
                        <li key={idx}>• {factor}</li>
                      ))
                    ) : (
                      <>
                        <li>• High humidity (&gt;80%)</li>
                        <li>• Temperature: 20-30°C</li>
                        <li>• Poor air circulation</li>
                        <li>• Wet leaf surfaces</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </section>

            {/* Severity & Risk Assessment */}
            <section className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <div className="flex items-center space-x-3 mb-6">
                <Zap className="w-6 h-6 text-yellow-600" />
                <h2 className="text-2xl font-bold text-gray-900">Risk Assessment</h2>
              </div>
              {renderTranslationAndSpeakControls('riskAssessment', selectedLanguage !== 'en-IN')}
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className={`w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center ${
                    confidenceValue > 80 ? 'bg-red-100 text-red-600' :
                    confidenceValue > 60 ? 'bg-yellow-100 text-yellow-600' :
                    'bg-green-100 text-green-600'
                  }`}>
                    <AlertCircle className="w-8 h-8" />
                  </div>
                  <h3 className="font-semibold text-gray-700 mb-2">Severity Level</h3>
                  <p className="text-gray-600">
                    {confidenceValue > 80 ? 'High Risk' :
                     confidenceValue > 60 ? 'Moderate Risk' : 'Low Risk'}
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-orange-100 text-orange-600 mx-auto mb-3 flex items-center justify-center">
                    <Users className="w-8 h-8" />
                  </div>
                  <h3 className="font-semibold text-gray-700 mb-2">Spread Risk</h3>
                  <p className="text-gray-600">{result.ai_analysis?.spread_risk || 'Moderate contagion potential'}</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-purple-100 text-purple-600 mx-auto mb-3 flex items-center justify-center">
                    <Clock className="w-8 h-8" />
                  </div>
                  <h3 className="font-semibold text-gray-700 mb-2">Urgency</h3>
                  <p className="text-gray-600">
                    {confidenceValue > 80 ? 'Immediate action' :
                     confidenceValue > 60 ? 'Within 7 days' : 'Monitor closely'}
                  </p>
                </div>
              </div>
            </section>

            {/* Treatment Options */}
            <section className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <div className="flex items-center space-x-3 mb-6">
                <Shield className="w-6 h-6 text-green-600" />
                <h2 className="text-2xl font-bold text-gray-900">Treatment & Management</h2>
              </div>
              {renderTranslationAndSpeakControls('treatment', selectedLanguage !== 'en-IN')}
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-700 mb-3">Immediate Actions</h3>
                  <ul className="space-y-2 text-gray-600">
                    {result.ai_analysis?.actions?.length > 0 ? (
                      result.ai_analysis.actions.slice(0, 4).map((action, idx) => (
                        <li key={idx}>• {action}</li>
                      ))
                    ) : (
                      <>
                        <li>• Fungicide applications</li>
                        <li>• Bactericide treatments</li>
                        <li>• Systemic pesticides</li>
                        <li>• Follow label instructions</li>
                      </>
                    )}
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-700 mb-3">Treatment Timeline</h3>
                  <ul className="space-y-2 text-gray-600">
                    {result.ai_analysis?.treatment_timeline?.length > 0 ? (
                      result.ai_analysis.treatment_timeline.map((timeline, idx) => (
                        <li key={idx}>• {timeline}</li>
                      ))
                    ) : (
                      <>
                        <li>• Immediate: Remove infected parts</li>
                        <li>• 1-7 days: Begin treatment program</li>
                        <li>• 2-4 weeks: Monitor and assess</li>
                      </>
                    )}
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-700 mb-3">Prevention Methods</h3>
                  <ul className="space-y-2 text-gray-600">
                    {result.ai_analysis?.prevention?.length > 0 ? (
                      result.ai_analysis.prevention.slice(0, 4).map((prevention, idx) => (
                        <li key={idx}>• {prevention}</li>
                      ))
                    ) : (
                      <>
                        <li>• Improve air circulation</li>
                        <li>• Adjust watering practices</li>
                        <li>• Remove infected material</li>
                        <li>• Soil health management</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </section>

            {/* Prevention & Protection */}
            <section className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <div className="flex items-center space-x-3 mb-6">
                <CheckCircle2 className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">Prevention & Protection</h2>
              </div>
              {renderTranslationAndSpeakControls('preventionProtection', selectedLanguage !== 'en-IN')}
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-700 mb-3">Preventive Measures</h3>
                  <ul className="space-y-2 text-gray-600">
                    {result.ai_analysis?.prevention?.length > 0 ? (
                      result.ai_analysis.prevention.map((prevention, idx) => (
                        <li key={idx}>• {prevention}</li>
                      ))
                    ) : (
                      <>
                        <li>• Use disease-resistant varieties</li>
                        <li>• Implement crop rotation</li>
                        <li>• Maintain proper plant spacing</li>
                        <li>• Regular monitoring and inspection</li>
                        <li>• Sanitize tools and equipment</li>
                      </>
                    )}
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-700 mb-3">Additional Actions</h3>
                  <ul className="space-y-2 text-gray-600">
                    {result.ai_analysis?.actions?.length > 4 ? (
                      result.ai_analysis.actions.slice(4).map((action, idx) => (
                        <li key={idx}>• {action}</li>
                      ))
                    ) : (
                      <>
                        <li>• Preventive fungicide programs</li>
                        <li>• Environmental modifications</li>
                        <li>• Quarantine new plants</li>
                        <li>• Integrated pest management</li>
                        <li>• Stress reduction techniques</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </section>

            {/* Alternative Diagnoses */}
            <section className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <div className="flex items-center space-x-3 mb-6">
                <FileText className="w-6 h-6 text-indigo-600" />
                <h2 className="text-2xl font-bold text-gray-900">Alternative Diagnoses</h2>
              </div>
              {renderTranslationAndSpeakControls('alternativeDiagnoses', selectedLanguage !== 'en-IN')}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-700 mb-3">Similar Conditions to Consider</h3>
                  <ul className="space-y-2 text-gray-600">
                    {result.ai_analysis?.alternative_diagnoses?.length > 0 ? (
                      result.ai_analysis.alternative_diagnoses.map((diagnosis, idx) => (
                        <li key={idx}>• {diagnosis}</li>
                      ))
                    ) : (
                      <>
                        <li>• Nutrient deficiency symptoms</li>
                        <li>• Environmental stress damage</li>
                        <li>• Other fungal infections</li>
                        <li>• Viral disease manifestations</li>
                        <li>• Insect damage patterns</li>
                        <li>• Chemical burn effects</li>
                      </>
                    )}
                  </ul>
                </div>
            </section>

            {/* Ethical Disclaimer */}
            <section className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-200">
              <div className="text-center">
                {/*<AlertCircle className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Important Disclaimer</h2>
                {renderTranslationAndSpeakControls('disclaimer', selectedLanguage !== 'en-IN')*/}
                <div className="max-w-4xl mx-auto space-y-4 text-gray-700">
                  <p className="text-lg">
                    This AI-powered analysis provides preliminary disease identification based on visual symptoms. 
                    Results should be considered as supportive information only.
                  </p>
                  <div className="grid md:grid-cols-2 gap-6 mt-6">
                    <div className="bg-white rounded-lg p-4">
                      <h3 className="font-semibold text-gray-800 mb-2">Professional Consultation Required</h3>
                      <p className="text-sm text-gray-600">
                        Always consult certified plant pathologists, agricultural extension services, 
                        or qualified agronomists for definitive diagnosis and treatment recommendations.
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                      <h3 className="font-semibold text-gray-800 mb-2">Responsible Use</h3>
                      <p className="text-sm text-gray-600">
                        This technology is designed to assist, not replace, professional expertise. 
                        Consider multiple diagnostic approaches and expert validation.
                      </p>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 mt-6">
                    <h3 className="font-semibold text-gray-800 mb-2">Analysis Details</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>Date: {formattedDate}</div>
                      <div>Disease: {result.disease}</div>
                      <div>Confidence: {confidenceValue.toFixed(1)}%</div>
                      <div>Model: {result.model}</div>
                      <div>Processing Time: {result.processing_time}s</div>
                      <div>Severity: {severityValue}</div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-4">
                    Confidence Level: {confidenceValue.toFixed(1)}% - 
                    {confidenceValue > 90 ? 'High confidence, but verification recommended' :
                     confidenceValue > 70 ? 'Moderate confidence, professional consultation advised' :
                     'Low confidence, multiple diagnostic methods strongly recommended'}
                  </p>
                </div>
              </div>
            </section>
          </div>

          <div className="flex gap-4 mt-8">
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



