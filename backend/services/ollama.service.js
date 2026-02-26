const axios = require('axios');

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434/api/generate';
const MODEL = process.env.OLLAMA_MODEL || 'llama3';
const TIMEOUT = 30000;

const SYSTEM_PROMPT = `You are PlantCare AI, an advanced agricultural disease intelligence assistant.

You MUST respond ONLY in valid JSON format. No markdown, no explanations outside JSON.

Severity Logic:
- confidence ≥ 0.85 → severity = "High"
- 0.60 ≤ confidence < 0.85 → severity = "Moderate"  
- confidence < 0.60 → severity = "Uncertain"

Scenario Behavior:
1. farm_monitoring: Professional, large-scale farming focus, operational advice
2. home_gardener: Simple, beginner-friendly, easy home remedies
3. agricultural_training: Educational, technical, scientific explanations

Output Format (STRICT):
{
  "scenario": "...",
  "disease": "...",
  "confidence": number,
  "severity": "...",
  "summary": "2-3 sentences about plant impact and disease characteristics",
  "actions": [
    "Immediate step 1 with specific details",
    "Treatment option 2 (include organic/chemical options)",
    "Management step 3 with application rates if applicable",
    "Monitoring and follow-up step 4",
    "Long-term control measure 5"
  ],
  "prevention": [
    "Cultural practice 1 with specific details",
    "Preventive treatment 2 (include product names if relevant)",
    "Environmental control 3",
    "Crop rotation or resistant variety recommendation 4",
    "Monitoring and early detection tip 5"
  ]
}

For chemical recommendations:
- Include specific fungicide/pesticide classes (e.g., "Apply copper-based fungicide like Bordeaux mixture")
- Mention application rates and timing
- Always suggest organic alternatives first for home gardeners
- Include safety precautions for chemical use

Respond ONLY with valid JSON.`;

class OllamaService {
  
  async generate(prompt, options = {}) {
    try {
      const response = await axios.post(
        OLLAMA_URL,
        {
          model: MODEL,
          prompt: prompt,
          stream: false,
          system: SYSTEM_PROMPT,
          options: {
            temperature: options.temperature || 0.7,
            top_p: options.top_p || 0.9,
            ...options
          }
        },
        {
          timeout: TIMEOUT,
          headers: { 'Content-Type': 'application/json' }
        }
      );

      return response.data.response;
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error('Ollama service is not running. Please start Ollama.');
      }
      if (error.code === 'ETIMEDOUT') {
        throw new Error('Ollama request timed out. Try again.');
      }
      throw new Error(`Ollama error: ${error.message}`);
    }
  }

  async analyzeDisease(disease, confidence, scenario = 'farm_monitoring') {
    const prompt = `Analyze this plant disease detection:

Detected Disease: ${disease}
Confidence: ${confidence}
Scenario: ${scenario}

Provide comprehensive disease management guidance including:
1. Disease characteristics and impact
2. Immediate treatment steps with specific chemical/organic options
3. Application rates and timing for treatments
4. Long-term prevention strategies
5. Recommended fungicides/pesticides with product examples
6. Safety precautions for chemical use

Provide scenario-aware guidance in JSON format.`;

    const response = await this.generate(prompt, { temperature: 0.6 });
    
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON in response');
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate and sanitize actions and prevention arrays
      if (parsed.actions && Array.isArray(parsed.actions)) {
        parsed.actions = parsed.actions.map(action => {
          if (typeof action === 'string') return action;
          if (typeof action === 'object') {
            return `${action.step || action.action || ''}: ${action.details || action.description || JSON.stringify(action)}`;
          }
          return String(action);
        });
      }
      
      if (parsed.prevention && Array.isArray(parsed.prevention)) {
        parsed.prevention = parsed.prevention.map(prev => {
          if (typeof prev === 'string') return prev;
          if (typeof prev === 'object') {
            return `${prev.strategy || prev.tip || ''}: ${prev.details || prev.description || JSON.stringify(prev)}`;
          }
          return String(prev);
        });
      }
      
      // Validate required fields
      if (!parsed.scenario || !parsed.disease || !parsed.severity || !parsed.summary || !parsed.actions || !parsed.prevention) {
        throw new Error('Missing required fields in response');
      }
      
      return parsed;
    } catch (parseError) {
      // Fallback response
      return this.getFallbackResponse(disease, confidence, scenario);
    }
  }

  getFallbackResponse(disease, confidence, scenario) {
    const severity = confidence >= 0.85 ? 'High' : confidence >= 0.60 ? 'Moderate' : 'Uncertain';
    
    const chemicalRecommendations = {
      fungal: [
        'Apply copper-based fungicide (Bordeaux mixture) at 2-3 g/L every 7-10 days',
        'Use systemic fungicide like Mancozeb (2g/L) or Chlorothalonil (2ml/L)',
        'Organic option: Neem oil spray (5ml/L) weekly',
        'Apply sulfur dust (3g/L) for powdery mildew types'
      ],
      bacterial: [
        'Apply copper hydroxide or copper oxychloride (2-3g/L)',
        'Use streptomycin sulfate (200ppm) if available and approved',
        'Organic option: Bordeaux mixture (1%) spray',
        'Remove infected parts and apply bactericide immediately'
      ],
      viral: [
        'No chemical cure available - focus on vector control',
        'Apply insecticide to control aphids/whiteflies (Imidacloprid 0.5ml/L)',
        'Use neem-based products for organic vector management',
        'Remove and destroy infected plants to prevent spread'
      ]
    };
    
    return {
      scenario,
      disease,
      confidence,
      severity,
      summary: `${disease} detected with ${(confidence * 100).toFixed(1)}% confidence. This condition may significantly affect plant health and requires immediate attention. Early intervention is crucial for effective management.`,
      actions: [
        'Isolate affected plants immediately to prevent disease spread to healthy crops',
        'Remove and destroy severely infected leaves/parts using sterilized tools',
        'Apply appropriate fungicide/pesticide: ' + (chemicalRecommendations.fungal[0]),
        'Improve air circulation and reduce humidity around plants',
        'Monitor daily for 2 weeks and reapply treatment as needed'
      ],
      prevention: [
        'Maintain proper plant spacing (30-45cm) for adequate air circulation',
        'Water at base of plants early morning, avoid wetting foliage',
        'Practice crop rotation with 2-3 year cycle to break disease cycle',
        'Use disease-resistant varieties when available for your region',
        'Apply preventive fungicide spray (Mancozeb 2g/L) every 15 days during susceptible periods'
      ]
    };
  }

  async explainDisease(disease, confidence) {
    const prompt = `You are an agricultural AI assistant. Explain the plant disease "${disease}" detected with ${(confidence * 100).toFixed(1)}% confidence.

Provide:
1. What is this disease
2. Common symptoms
3. How it spreads
4. Risk level

Keep response under 150 words. Use simple language.`;

    const response = await this.generate(prompt, { temperature: 0.5 });
    
    return {
      disease,
      confidence,
      explanation: response.trim()
    };
  }

  async getFarmerAdvice(disease, confidence, crop = 'general') {
    const prompt = `You are an agricultural advisor. A farmer detected "${disease}" on their ${crop} crop with ${(confidence * 100).toFixed(1)}% confidence.

Provide practical advice:
1. Immediate actions (next 24 hours)
2. Treatment options (organic first, then chemical)
3. Prevention tips
4. Expected recovery time

Use farmer-friendly language. Keep under 200 words.`;

    const response = await this.generate(prompt, { temperature: 0.6 });
    
    return {
      disease,
      crop,
      advice: response.trim(),
      urgency: confidence > 0.8 ? 'high' : confidence > 0.6 ? 'medium' : 'low'
    };
  }

  async getEducationalExplanation(disease, confidence) {
    const prompt = `You are an agricultural education instructor. Explain "${disease}" for students learning plant pathology.

Include:
1. Scientific classification
2. Pathogen details (fungus/bacteria/virus)
3. Disease cycle and lifecycle
4. Economic impact
5. Research and management strategies

Use educational tone. Keep under 250 words.`;

    const response = await this.generate(prompt, { temperature: 0.4 });
    
    return {
      disease,
      confidence,
      educational_content: response.trim(),
      difficulty_level: 'intermediate'
    };
  }

  async checkHealth() {
    try {
      const response = await axios.get('http://localhost:11434/api/tags', {
        timeout: 5000
      });
      return {
        status: 'online',
        models: response.data.models || []
      };
    } catch (error) {
      return {
        status: 'offline',
        error: error.message
      };
    }
  }
}

module.exports = new OllamaService();
