// VoiceAuth webhook bridge with creator tracking
// Receives Discord verification requests and forwards to the Bedrock server
// Logs YouTubers/Streamers and provides monthly exports
// Run with: node webhook_stub.js

import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// Store pending verifications and creator data
const verificationQueue = new Map();
const creatorData = {
  currentMonth: [],
  lastReset: Date.now(),
  history: []
};

const CREATORS_FILE = path.join(__dirname, 'creators_log.json');

// Load existing creator data
function loadCreatorData() {
  try {
    if (fs.existsSync(CREATORS_FILE)) {
      const data = JSON.parse(fs.readFileSync(CREATORS_FILE, 'utf8'));
      Object.assign(creatorData, data);
      console.log(`[Webhook] Loaded ${creatorData.currentMonth.length} current creators`);
    }
  } catch (err) {
    console.error('[Webhook] Error loading creator data:', err.message);
  }
}

// Save creator data to file
function saveCreatorData() {
  try {
    fs.writeFileSync(CREATORS_FILE, JSON.stringify(creatorData, null, 2));
  } catch (err) {
    console.error('[Webhook] Error saving creator data:', err.message);
  }
}

loadCreatorData();

// Discord sends verification here
app.post('/verify', (req, res) => {
  try {
    const { uuid, verified, isCreator = false, platform = 'minecraft' } = req.body;
    
    if (!uuid || typeof verified !== 'boolean') {
      console.error('[Webhook] Invalid payload:', req.body);
      return res.status(400).json({ error: 'Invalid payload. Expected { uuid, verified }' });
    }

    console.log(`[Webhook] Verification: ${uuid} => ${verified ? 'APPROVED' : 'DENIED'}${isCreator ? ' [CREATOR]' : ''}`);
    
    // Store in queue for the game to fetch
    verificationQueue.set(uuid, {
      verified: verified,
      isCreator: isCreator,
      platform: platform,
      timestamp: Date.now()
    });

    // If creator and verified, log them
    if (verified && isCreator) {
      const existing = creatorData.currentMonth.find(c => c.uuid === uuid);
      if (existing) {
        existing.lastVerified = Date.now();
        existing.verifyCount = (existing.verifyCount || 1) + 1;
      } else {
        creatorData.currentMonth.push({
          uuid,
          platform,
          verified: Date.now(),
          verifyCount: 1
        });
      }
      saveCreatorData();
      console.log(`[Webhook] Creator logged: ${uuid} (${platform})`);
    }

    res.json({ success: true, message: `Verification queued for ${uuid}` });
  } catch (err) {
    console.error('[Webhook] Error processing verification:', err);
    res.status(500).json({ error: err.message });
  }
});

// Game server fetches pending verifications
app.get('/verify-pending/:uuid', (req, res) => {
  try {
    const { uuid } = req.params;
    const verification = verificationQueue.get(uuid);
    
    if (!verification) {
      return res.json({ verified: null, message: 'No pending verification' });
    }

    // Remove from queue after sending
    verificationQueue.delete(uuid);
    console.log(`[Webhook] Verification fetched: ${uuid}`);
    res.json(verification);
  } catch (err) {
    console.error('[Webhook] Error fetching verification:', err);
    res.status(500).json({ error: err.message });
  }
});

// Export current month's creators
app.get('/creators/current', (req, res) => {
  try {
    res.json({
      month: new Date().toISOString().slice(0, 7),
      total: creatorData.currentMonth.length,
      creators: creatorData.currentMonth
    });
  } catch (err) {
    console.error('[Webhook] Error exporting creators:', err);
    res.status(500).json({ error: err.message });
  }
});

// Reset monthly creators (admin only - requires auth token)
app.post('/creators/reset', (req, res) => {
  try {
    const { token } = req.body;
    const ADMIN_TOKEN = process.env.VOICEAUTH_ADMIN_TOKEN || 'admin123';
    
    if (token !== ADMIN_TOKEN) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const previousMonth = {
      month: new Date().toISOString().slice(0, 7),
      total: creatorData.currentMonth.length,
      creators: creatorData.currentMonth
    };

    creatorData.history.push(previousMonth);
    creatorData.currentMonth = [];
    creatorData.lastReset = Date.now();
    saveCreatorData();

    console.log(`[Webhook] Monthly reset: ${previousMonth.total} creators archived`);
    res.json({
      success: true,
      message: `Reset completed. ${previousMonth.total} creators archived.`,
      archived: previousMonth
    });
  } catch (err) {
    console.error('[Webhook] Error resetting creators:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get creator history (all months)
app.get('/creators/history', (req, res) => {
  try {
    res.json({
      currentMonth: {
        month: new Date().toISOString().slice(0, 7),
        total: creatorData.currentMonth.length,
        creators: creatorData.currentMonth
      },
      previousMonths: creatorData.history
    });
  } catch (err) {
    console.error('[Webhook] Error fetching history:', err);
    res.status(500).json({ error: err.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    pendingVerifications: verificationQueue.size,
    currentCreators: creatorData.currentMonth.length,
    totalHistory: creatorData.history.reduce((sum, m) => sum + m.total, 0)
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[Webhook] VoiceAuth bridge listening on http://localhost:${PORT}`);
  console.log(`[Webhook] Creator tracking enabled`);
  console.log(`[Webhook] Current creators this month: ${creatorData.currentMonth.length}`);
});
