const express = require('express');
const router = express.Router();
const translate = require('translate-google');

const langCodeMap = {
  'English': 'en',
  'Hindi': 'hi',
  'Kannada': 'kn',
  'Tamil': 'ta',
  'Telugu': 'te',
  'Malayalam': 'ml'
};

router.post('/translate', async (req, res) => {
  try {
    const { text, targetLanguage } = req.body;
    
    const langCode = langCodeMap[targetLanguage] || 'en';
    
    console.log('Translating to:', targetLanguage, '(', langCode, ')');
    console.log('Text:', text.substring(0, 100) + '...');
    
    if (langCode === 'en') {
      return res.json({ translatedText: text });
    }
    
    const result = await translate(text, { to: langCode });
    
    console.log('Translation success:', result.substring(0, 100) + '...');
    
    res.json({ translatedText: result });
  } catch (error) {
    console.error('Translation error:', error.message);
    res.json({ translatedText: req.body.text });
  }
});

module.exports = router;