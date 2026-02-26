const ollamaService = require('../services/ollama.service');

class AIController {
  
  async analyzeDisease(req, res) {
    try {
      const { disease, confidence, scenario } = req.body;

      if (!disease) {
        return res.status(400).json({
          success: false,
          message: 'Disease name is required'
        });
      }

      const validScenarios = ['farm_monitoring', 'home_gardener', 'agricultural_training'];
      const selectedScenario = validScenarios.includes(scenario) ? scenario : 'farm_monitoring';

      const result = await ollamaService.analyzeDisease(
        disease,
        confidence || 0.5,
        selectedScenario
      );

      return res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Analyze disease error:', error);
      return res.status(500).json({
        success: false,
        message: error.message,
        fallback: ollamaService.getFallbackResponse(
          req.body.disease || 'Unknown',
          req.body.confidence || 0.5,
          req.body.scenario || 'farm_monitoring'
        )
      });
    }
  }
  
  async explainDisease(req, res) {
    try {
      const { disease, confidence } = req.body;

      if (!disease) {
        return res.status(400).json({
          success: false,
          message: 'Disease name is required'
        });
      }

      const result = await ollamaService.explainDisease(
        disease,
        confidence || 0.5
      );

      return res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Explain disease error:', error);
      return res.status(500).json({
        success: false,
        message: error.message,
        fallback: 'AI service unavailable. Please try again later.'
      });
    }
  }

  async getFarmerAdvice(req, res) {
    try {
      const { disease, confidence, crop } = req.body;

      if (!disease) {
        return res.status(400).json({
          success: false,
          message: 'Disease name is required'
        });
      }

      const result = await ollamaService.getFarmerAdvice(
        disease,
        confidence || 0.5,
        crop
      );

      return res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Farmer advice error:', error);
      return res.status(500).json({
        success: false,
        message: error.message,
        fallback: 'AI service unavailable. Please consult local agricultural extension.'
      });
    }
  }

  async getEducationalExplanation(req, res) {
    try {
      const { disease, confidence } = req.body;

      if (!disease) {
        return res.status(400).json({
          success: false,
          message: 'Disease name is required'
        });
      }

      const result = await ollamaService.getEducationalExplanation(
        disease,
        confidence || 0.5
      );

      return res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Educational explanation error:', error);
      return res.status(500).json({
        success: false,
        message: error.message,
        fallback: 'AI service unavailable. Please refer to textbook resources.'
      });
    }
  }

  async checkHealth(req, res) {
    try {
      const health = await ollamaService.checkHealth();
      
      return res.json({
        success: true,
        data: health
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async chat(req, res) {
    try {
      const { message, scenario } = req.body;

      if (!message) {
        return res.status(400).json({
          success: false,
          message: 'Message is required'
        });
      }

      const validScenarios = ['farm_monitoring', 'home_gardener', 'agricultural_training'];
      const selectedScenario = validScenarios.includes(scenario) ? scenario : 'farm_monitoring';

      const scenarioContext = {
        farm_monitoring: 'You are a helpful agricultural AI assistant for professional farmers. Provide practical advice on farming, crops, diseases, weather, equipment, and general agricultural topics. Be conversational and friendly.',
        home_gardener: 'You are a friendly gardening assistant for home gardeners. Help with plants, gardening tips, pest control, and general gardening questions. Use simple, easy-to-understand language.',
        agricultural_training: 'You are an agricultural education assistant. Provide detailed, educational responses about agriculture, plant science, and farming techniques. Be informative and thorough.'
      };

      const prompt = `${scenarioContext[selectedScenario]}\n\nUser: ${message}\n\nProvide a helpful, natural response. You can discuss agriculture, plants, farming, weather, equipment, general advice, or even have casual conversation. Keep responses under 200 words and be conversational.`;

      const result = await ollamaService.generate(prompt, { temperature: 0.8 });

      let responseText = result.trim();
      
      // Try to parse if it's JSON and extract the response
      try {
        const parsed = JSON.parse(responseText);
        if (parsed.response) responseText = parsed.response;
        else if (parsed.summary) responseText = parsed.summary;
      } catch (e) {
        // Not JSON, use as is
      }

      return res.json({
        success: true,
        data: {
          response: responseText,
          scenario: selectedScenario
        }
      });

    } catch (error) {
      console.error('Chat error:', error);
      return res.status(500).json({
        success: false,
        message: error.message,
        data: {
          response: 'I apologize, but I\'m having trouble connecting to the AI service. Please ensure Ollama is running and try again.'
        }
      });
    }
  }
}

module.exports = new AIController();
