const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/plantcare_ai';

async function verifyDatabase() {
  console.log('🔍 Database Verification Tool\n');
  console.log('═══════════════════════════════════════════════════\n');
  
  try {
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000
    });
    console.log('✅ Connected to:', mongoose.connection.name);
    console.log('   Host:', mongoose.connection.host);
    console.log('   Port:', mongoose.connection.port, '\n');
    
    const Scan = require('./models/scan.model');
    
    console.log('📊 Database Statistics:\n');
    const totalScans = await Scan.countDocuments();
    console.log(`   Total Scans: ${totalScans}`);
    
    if (totalScans > 0) {
      const recentScans = await Scan.find().sort({ timestamp: -1 }).limit(5);
      console.log('\n📋 Recent Scans:\n');
      
      recentScans.forEach((scan, idx) => {
        console.log(`   ${idx + 1}. ${scan.disease}`);
        console.log(`      Confidence: ${(scan.confidence * 100).toFixed(1)}%`);
        console.log(`      Severity: ${scan.severity}`);
        console.log(`      Scenario: ${scan.scenario}`);
        console.log(`      Date: ${scan.timestamp.toLocaleString()}\n`);
      });
      
      const diseaseStats = await Scan.aggregate([
        { $group: { _id: '$disease', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]);
      
      console.log('🏆 Top Detected Diseases:\n');
      diseaseStats.forEach((stat, idx) => {
        console.log(`   ${idx + 1}. ${stat._id}: ${stat.count} detections`);
      });
      console.log('');
      
      const avgConfidence = await Scan.aggregate([
        { $group: { _id: null, avg: { $avg: '$confidence' } } }
      ]);
      
      if (avgConfidence.length > 0) {
        console.log(`📈 Average Confidence: ${(avgConfidence[0].avg * 100).toFixed(1)}%\n`);
      }
    } else {
      console.log('\n   ℹ️  No scans in database yet\n');
    }
    
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ Database verification complete!\n');
    
  } catch (error) {
    console.log('❌ Database Error:', error.message, '\n');
    console.log('💡 Troubleshooting:');
    console.log('   1. Check if MongoDB is running: mongod');
    console.log('   2. Verify connection string in .env');
    console.log('   3. Check firewall settings\n');
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

verifyDatabase();
