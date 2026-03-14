const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Available captions.js presets
const AVAILABLE_PRESETS = [
  'Karaoke', 'Banger', 'Acid', 'Lovly', 'Marvel', 'Marker',
  'Neon Pulse', 'Beasty', 'Crazy', 'Safari', 'Popline', 'Desert',
  'Hook', 'Sky', 'Flamingo', 'Deep Diver B&W', 'New', 'Catchy',
  'From', 'Classic', 'Classic Big', 'Old Money', 'Cinema',
  'Midnight Serif', 'Aurora Ink'
];

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'video-captions-service',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint with service info
app.get('/', (req, res) => {
  res.json({ 
    service: 'Video Captions Service',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      burnCaptions: '/burn-captions'
    },
    availablePresets: AVAILABLE_PRESETS,
    presetCount: AVAILABLE_PRESETS.length,
    status: 'running'
  });
});

// Main caption burning endpoint
app.post('/burn-captions', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { videoUrl, captions, preset, jobId } = req.body;
    
    console.log(`📝 [${new Date().toISOString()}] Processing caption request:`);
    console.log(`   Job ID: ${jobId}`);
    console.log(`   Video URL: ${videoUrl ? videoUrl.substring(0, 50) + '...' : 'missing'}`);
    console.log(`   Captions: ${captions?.length || 0} words`);
    console.log(`   Preset: ${preset}`);
    
    // Input validation
    const errors = [];
    
    if (!videoUrl) {
      errors.push('videoUrl is required');
    }
    
    if (!captions || !Array.isArray(captions)) {
      errors.push('captions must be an array');
    } else if (captions.length === 0) {
      errors.push('captions array cannot be empty');
    } else {
      // Validate caption format
      const invalidCaptions = captions.filter((cap, index) => {
        if (!cap.word || typeof cap.startTime !== 'number' || typeof cap.endTime !== 'number') {
          console.log(`❌ Invalid caption at index ${index}:`, cap);
          return true;
        }
        return false;
      });
      
      if (invalidCaptions.length > 0) {
        errors.push(`${invalidCaptions.length} captions have invalid format (need: {word, startTime, endTime})`);
      }
    }
    
    if (!preset) {
      errors.push('preset is required');
    } else if (!AVAILABLE_PRESETS.includes(preset)) {
      errors.push(`Invalid preset "${preset}". Available: ${AVAILABLE_PRESETS.join(', ')}`);
    }
    
    if (errors.length > 0) {
      console.log(`❌ Validation errors:`, errors);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      });
    }
    
    console.log(`✅ Input validation passed`);
    
    // Validate video URL is accessible
    try {
      console.log(`🔍 Checking if video URL is accessible...`);
      const videoCheck = await axios.head(videoUrl, { timeout: 10000 });
      console.log(`✅ Video URL accessible (${videoCheck.status})`);
    } catch (videoError) {
      console.log(`❌ Video URL not accessible:`, videoError.message);
      return res.status(400).json({
        success: false,
        error: 'Video URL is not accessible',
        details: videoError.message
      });
    }
    
    // FOR NOW: Return original video (caption burning not implemented yet)
    console.log(`⚠️ Caption burning not yet implemented - returning original video`);
    console.log(`📊 Processing time: ${Date.now() - startTime}ms`);
    
    res.json({
      success: true,
      videoUrl: videoUrl, // Return original video for now
      message: 'Caption service is working! Actual caption burning will be implemented next.',
      processingTime: Date.now() - startTime,
      metadata: {
        jobId,
        preset,
        captionCount: captions.length,
        totalDuration: captions.length > 0 ? captions[captions.length - 1].endTime : 0
      }
    });
    
  } catch (error) {
    console.error(`❌ Caption service error:`, error);
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
      processingTime: Date.now() - startTime
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    availableEndpoints: ['/', '/health', '/burn-captions']
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Video Captions Service started on port ${PORT}`);
  console.log(`📋 Available presets: ${AVAILABLE_PRESETS.length}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📅 Started at: ${new Date().toISOString()}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📴 Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('📴 Received SIGINT, shutting down gracefully');
  process.exit(0);
});
