const axios = require('axios');

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434/api/generate';
const MODEL = process.env.OLLAMA_MODEL || 'llama3';
const TIMEOUT = 30000;

const SYSTEM_PROMPT = `You are PlantCare AI, an advanced agricultural disease intelligence assistant with expertise in plant pathology, integrated pest management, and sustainable agriculture.

You MUST respond ONLY in valid JSON format. No markdown, no explanations outside JSON.

IMPORTANT: All array items MUST be simple strings, NOT objects or nested JSON.

Severity Logic:
- confidence ≥ 0.85 → severity = "High"
- 0.60 ≤ confidence < 0.85 → severity = "Moderate"  
- confidence < 0.60 → severity = "Uncertain"

Scenario Behavior:
1. farm_monitoring: Professional, large-scale farming focus, operational advice, economic considerations
2. home_gardener: Simple, beginner-friendly, easy home remedies, organic focus
3. agricultural_training: Educational, technical, scientific explanations, research-based

Output Format (STRICT):
{
  "scenario": "...",
  "disease": "...",
  "confidence": number,
  "severity": "...",
  "summary": "2-3 sentences about disease characteristics, plant impact, and management urgency",
  "scientific_name": "Scientific pathogen name if known",
  "pathogen_type": "Fungal/Bacterial/Viral/Physiological",
  "symptoms": [
    "Leaf spots with yellow halos",
    "Wilting of young shoots",
    "Brown lesions on stems",
    "Premature leaf drop"
  ],
  "causes": [
    "High humidity conditions",
    "Poor air circulation",
    "Overhead watering",
    "Infected plant debris"
  ],
  "actions": [
    "Apply copper-based fungicide (Bordeaux mixture 1%) every 7-10 days",
    "Remove infected plant material and dispose properly",
    "Improve air circulation by pruning and spacing",
    "Apply systemic fungicide like Mancozeb (2g/L) for severe cases",
    "Monitor daily and isolate affected plants"
  ],
  "prevention": [
    "Use disease-resistant varieties when available",
    "Practice crop rotation with 2-3 year cycle",
    "Maintain proper plant spacing for air circulation",
    "Apply preventive copper spray before disease season",
    "Remove plant debris and sanitize tools regularly"
  ],
  "treatment_timeline": [
    "Immediate (0-24h): Remove infected parts, apply emergency treatment",
    "Short-term (1-7 days): Begin fungicide program, monitor progress",
    "Long-term (2-4 weeks): Continue treatment, assess recovery"
  ],
  "environmental_factors": [
    "Temperature: 20-30°C favors development",
    "Humidity: >80% increases infection risk",
    "Rainfall: Wet conditions promote spread",
    "Season: Most active during monsoon/wet season"
  ],
  "spread_risk": "High/Moderate/Low - description of contagion potential",
  "alternative_diagnoses": [
    "Nutrient deficiency (nitrogen/potassium)",
    "Environmental stress damage",
    "Similar fungal infections"
  ]
}

For chemical recommendations:
- Include specific product names and application rates
- Mention timing, frequency, and safety precautions
- Always suggest organic alternatives
- Consider resistance management

Respond ONLY with valid JSON. Each array item must be a complete, informative string.`;

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
          headers: { 'Content-Type': 'application/json' }
        }
      );

      return response.data.response;
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error('Ollama service is not running. Please start Ollama.');
      }
      throw new Error(`Ollama error: ${error.message}`);
    }
  }

  async analyzeDisease(disease, confidence, scenario = 'farm_monitoring', severity_percent = null) {
    const prompt = `Analyze this plant disease detection with comprehensive pathological assessment:

Detected Disease: ${disease}
Confidence: ${(confidence * 100).toFixed(1)}%
${severity_percent !== null ? `Infection Severity: ${severity_percent}% (detected by OpenCV analysis)` : ''}
Scenario: ${scenario}

Provide comprehensive disease management guidance including:
1. Scientific classification and pathogen identification
2. Detailed symptom description and disease progression
3. Environmental causes and favorable conditions
4. Immediate and long-term treatment protocols
5. Specific chemical and organic control options with rates
6. Prevention strategies and cultural practices
7. Treatment timeline and monitoring schedule
8. Environmental factors affecting disease development
9. Risk assessment for disease spread
10. Alternative diagnoses to consider

Ensure all recommendations are evidence-based and include safety considerations.
Provide scenario-appropriate guidance in JSON format.`;

    const response = await this.generate(prompt, { temperature: 0.6 });
    
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON in response');
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate and sanitize all arrays
      const arrayFields = ['symptoms', 'causes', 'actions', 'prevention', 'treatment_timeline', 'environmental_factors', 'alternative_diagnoses'];
      
      arrayFields.forEach(field => {
        if (parsed[field] && Array.isArray(parsed[field])) {
          parsed[field] = parsed[field].map(item => {
            if (typeof item === 'string') {
              return item.replace(/^[^:]*:\s*\{.*?\}\s*/, '').trim() || item;
            }
            if (typeof item === 'object' && item !== null) {
              return Object.values(item).join(' ') || JSON.stringify(item);
            }
            return String(item);
          }).filter(item => item && item.length > 0);
        }
      });
      
      // Validate required fields
      const requiredFields = ['scenario', 'disease', 'severity', 'summary', 'actions', 'prevention'];
      const missingFields = requiredFields.filter(field => !parsed[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }
      
      return parsed;
    } catch (parseError) {
      console.error('Ollama parse error:', parseError.message);
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
