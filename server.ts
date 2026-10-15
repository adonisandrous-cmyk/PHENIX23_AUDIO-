import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '15mb' }));

// Initialize GoogleGenAI SDK with required telemetry headers
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey ? new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
}) : null;

// API Route: Generate Music-Synchronized Video Storyboard
app.post('/api/ai/storyboard', async (req, res) => {
  try {
    const { storyPrompt, mood, track, audioProfile } = req.body;

    if (!ai) {
      // Fallback structured storyboard if Gemini key not yet attached
      return res.json({
        success: true,
        isFallback: true,
        storyboard: generateFallbackStoryboard(storyPrompt, mood, track)
      });
    }

    const duration = track?.duration || 30;
    const bpm = track?.bpm || 120;
    const title = track?.title || 'Audio Track';
    const genre = track?.genre || 'Electronic';

    const systemInstruction = `You are an elite music video director and visual storyboard architect.
Given a song's musical parameters (BPM: ${bpm}, Genre: ${genre}, Duration: ${duration}s) and the user's storyline & mood prompt, generate a cinematic, beat-synchronized music video storyboard broken down into 4-6 timed scenes.
Each scene must align with musical sections (Intro, Build-Up, Beat Drop / Climax, Breakdown, Outro).`;

    const userPromptText = `Storyline Concept: "${storyPrompt || 'A neon cyberpunk flight across a rain-soaked futuristic metropolis'}"
Target Mood: "${mood || 'Cinematic, High Energy'}"
Track Details: Title: "${title}", BPM: ${bpm}, Genre: "${genre}", Bass Energy: ${audioProfile?.bass || 0.5}.
Create a synchronized video scene sequence matching the musical dynamics.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userPromptText,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            conceptTitle: { type: Type.STRING },
            musicalVibe: { type: Type.STRING },
            scenes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  timeStart: { type: Type.NUMBER, description: 'Start time in seconds' },
                  timeEnd: { type: Type.NUMBER, description: 'End time in seconds' },
                  sceneTitle: { type: Type.STRING },
                  visualDescription: { type: Type.STRING },
                  cinematicPrompt: { type: Type.STRING, description: 'Image generation prompt for visual canvas frame' },
                  cameraMotion: { 
                    type: Type.STRING, 
                    description: 'Camera action: slow-zoom-in, fast-dolly-pan, bass-shake, vertical-drift, orbital-spin' 
                  },
                  accentColor: { type: Type.STRING, description: 'Hex color matching this scene' },
                  narrativeSubtitle: { type: Type.STRING, description: 'Subtitle or lyric text to overlay' },
                  energyLevel: { type: Type.NUMBER, description: 'Energy from 0.0 to 1.0' }
                },
                required: ['id', 'timeStart', 'timeEnd', 'sceneTitle', 'visualDescription', 'cinematicPrompt', 'cameraMotion', 'accentColor', 'narrativeSubtitle', 'energyLevel']
              }
            }
          },
          required: ['conceptTitle', 'musicalVibe', 'scenes']
        }
      }
    });

    const parsedData = JSON.parse(response.text || '{}');
    return res.json({
      success: true,
      isFallback: false,
      storyboard: parsedData
    });

  } catch (error: any) {
    console.error('Error generating AI video storyboard:', error);
    // Provide safe graceful fallback so UI never breaks
    const fallback = generateFallbackStoryboard(req.body.storyPrompt, req.body.mood, req.body.track);
    return res.json({
      success: true,
      isFallback: true,
      error: error?.message,
      storyboard: fallback
    });
  }
});

function generateFallbackStoryboard(prompt: string, mood: string, track: any) {
  const bpm = track?.bpm || 120;
  const duration = Math.min(30, track?.duration || 30);
  const step = duration / 4;

  return {
    conceptTitle: prompt ? `Visual Odyssey: ${prompt.slice(0, 30)}` : 'Neon Cyberpunk Voyage',
    musicalVibe: mood || 'Atmospheric & Dynamic',
    scenes: [
      {
        id: 'scene-1',
        timeStart: 0,
        timeEnd: Number(step.toFixed(1)),
        sceneTitle: 'Opening Awakening: Low Hum & Atmosphere',
        visualDescription: 'Mist rolling over dark architectural contours as neon beacons flicker on.',
        cinematicPrompt: 'Dark retro-futuristic city with towering monolithic spires shrouded in violet fog and glowing signs.',
        cameraMotion: 'slow-zoom-in',
        accentColor: '#8b5cf6',
        narrativeSubtitle: 'In the stillness before the pulse...',
        energyLevel: 0.3
      },
      {
        id: 'scene-2',
        timeStart: Number(step.toFixed(1)),
        timeEnd: Number((step * 2).toFixed(1)),
        sceneTitle: 'Build-Up: Accelerating Momentum',
        visualDescription: 'Light trails streak past the camera as velocity surges forward.',
        cinematicPrompt: 'High speed tracking shot through neon-lit futuristic highway with gleaming wet asphalt reflections.',
        cameraMotion: 'fast-dolly-pan',
        accentColor: '#06b6d4',
        narrativeSubtitle: 'Acceleration kicks in. Frequencies converge.',
        energyLevel: 0.65
      },
      {
        id: 'scene-3',
        timeStart: Number((step * 2).toFixed(1)),
        timeEnd: Number((step * 3).toFixed(1)),
        sceneTitle: 'The Drop: Sonic Apex & Climax',
        visualDescription: 'Explosive burst of radiant particle shockwaves and volumetric light rays.',
        cinematicPrompt: 'Blinding explosion of golden amber and cyan light shockwaves illuminating crystal towers.',
        cameraMotion: 'bass-shake',
        accentColor: '#f59e0b',
        narrativeSubtitle: 'Maximum resonance unleashed across the skyline.',
        energyLevel: 1.0
      },
      {
        id: 'scene-4',
        timeStart: Number((step * 3).toFixed(1)),
        timeEnd: Number(duration.toFixed(1)),
        sceneTitle: 'Outro: Horizon Fade & Resolution',
        visualDescription: 'Drifting into the infinite stellar horizon as bass subs fade into tranquility.',
        cinematicPrompt: 'Calm panoramic vista of an infinite starry cosmos with a glowing planetary ring horizon.',
        cameraMotion: 'orbital-spin',
        accentColor: '#ec4899',
        narrativeSubtitle: 'Echoes linger in the quiet void.',
        energyLevel: 0.4
      }
    ]
  };
}

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`AIMP Visualizer Studio server running at http://0.0.0.0:${port}`);
  });
}

startServer();
