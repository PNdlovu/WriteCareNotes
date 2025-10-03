import { Router, Request, Response } from 'express';
import { VoiceToNoteAgent } from '../services/VoiceToNoteAgent';

const router = Router();
const voiceToNoteAgent = new VoiceToNoteAgent();

// Voice-to-Note Agent routes
router.post('/voice-note/transcribe', async (req: Request, res: Response) => {
  try {
    const result = await voiceToNoteAgent.processVoiceToNote(req.body);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/voice-note/generate', async (req: Request, res: Response) => {
  try {
    const result = await voiceToNoteAgent.processVoiceToNote(req.body);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Agent status and capabilities
router.get('/status', async (req: Request, res: Response) => {
  try {
    const status = voiceToNoteAgent.getStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/capabilities', async (req: Request, res: Response) => {
  try {
    const capabilities = voiceToNoteAgent.getCapabilities();
    res.json(capabilities);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Chat interface for AI agents
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { message, context, agentType = 'voice-note' } = req.body;
    
    let response;
    switch (agentType) {
      case 'voice-note':
        response = await handleVoiceNoteChat(message, context);
        break;
      default:
        response = { message: 'Unknown agent type', agent: agentType };
    }
    
    res.json(response);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Agent health check
router.get('/health', async (req: Request, res: Response) => {
  try {
    const status = voiceToNoteAgent.getStatus();
    res.json({
      status: 'healthy',
      agent: status.name,
      capabilities: Object.keys(status.capabilities).filter(key => status.capabilities[key as keyof typeof status.capabilities]),
      lastActivity: status.lastActivity,
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'unhealthy', 
      error: error.message 
    });
  }
});

// Mock chat handler for voice-note agent
async function handleVoiceNoteChat(message: string, context: any): Promise<any> {
  const responses = {
    greeting: "Hello! I'm the Voice-to-Note Agent. I can help you transcribe voice recordings into structured care notes. How can I assist you?",
    help: "I can help you with:\n- Transcribing voice recordings\n- Generating structured care notes\n- Analyzing sentiment and extracting key information\n- Suggesting follow-up actions\n\nJust send me an audio file or describe what you need!",
    transcription: "I can transcribe your voice recordings. Please provide the audio file in WAV, MP3, M4A, or WebM format.",
    note_generation: "I can generate structured care notes from your transcriptions. I'll analyze the content for medical terms, sentiment, and action items.",
    status: "I'm currently active and ready to process voice recordings and generate care notes.",
    capabilities: "My capabilities include:\n- Voice transcription\n- Note generation\n- Sentiment analysis\n- Keyword extraction\n- Action item detection\n- Risk assessment\n- Language detection\n- Summarization",
    error: "I'm sorry, I didn't understand that. Please try asking about transcription, note generation, or my capabilities."
  };

  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    return { message: responses.greeting, type: 'greeting' };
  }
  
  if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
    return { message: responses.help, type: 'help' };
  }
  
  if (lowerMessage.includes('transcribe') || lowerMessage.includes('transcription')) {
    return { message: responses.transcription, type: 'transcription' };
  }
  
  if (lowerMessage.includes('note') || lowerMessage.includes('generate')) {
    return { message: responses.note_generation, type: 'note_generation' };
  }
  
  if (lowerMessage.includes('status') || lowerMessage.includes('how are you')) {
    return { message: responses.status, type: 'status' };
  }
  
  if (lowerMessage.includes('capabilities') || lowerMessage.includes('features')) {
    return { message: responses.capabilities, type: 'capabilities' };
  }
  
  return { message: responses.error, type: 'error' };
}

export default router;