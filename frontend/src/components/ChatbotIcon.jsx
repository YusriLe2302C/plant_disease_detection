import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { chatWithAI } from '../utils/api';

const SCENARIOS = [
  { id: 'farm_monitoring', label: 'Farm Monitoring', desc: 'Large-scale agricultural operations' },
  { id: 'home_gardener', label: 'Home Gardener', desc: 'Personal garden care' },
  { id: 'agricultural_training', label: 'Education', desc: 'Learning & training' }
];

const ChatbotIcon = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [scenario, setScenario] = useState('farm_monitoring');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: 'Hello! I\'m PlantCare AI, your agricultural assistant. I can help you with plant diseases, farming advice, gardening tips, weather concerns, equipment recommendations, or just have a friendly chat about agriculture. What would you like to know?'
      }]);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await chatWithAI(input, scenario);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.data.response || 'I apologize, but I couldn\'t process that request.'
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I\'m having trouble connecting. Please ensure the AI service is running.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full shadow-lg hover:scale-110 transition-all duration-300 flex items-center justify-center group"
        aria-label="Toggle chatbot"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MessageCircle className="w-6 h-6 text-white group-hover:animate-bounce" />
        )}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 h-[500px] glass rounded-2xl shadow-2xl animate-fade-in-up flex flex-col overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-4 text-white">
            <h3 className="font-semibold text-lg">PlantCare AI Assistant</h3>
            <select
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              className="mt-2 w-full px-3 py-1.5 rounded-lg text-sm bg-white/20 backdrop-blur-sm border border-white/30 text-white font-medium"
            >
              {SCENARIOS.map(s => (
                <option key={s.id} value={s.id} className="text-gray-900">
                  {s.label} - {s.desc}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                      : 'bg-white text-gray-800 shadow-sm'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white px-4 py-2 rounded-2xl shadow-sm">
                  <Loader2 className="w-5 h-5 text-green-600 animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 bg-white border-t border-gray-200">
            <div className="flex space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask anything about agriculture..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                disabled={loading}
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatbotIcon;
