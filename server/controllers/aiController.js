const OpenAI = require('openai');
const Wish = require('../models/Wish');
const { Notification } = require('../models/index');
const { AppError } = require('../utils/errors');
const logger = require('../utils/logger');

const catchAsync = (fn) => (req, res, next) => fn(req, res, next).catch(next);

let openai;
try {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
} catch (e) {
  logger.warn('OpenAI not initialized — AI features will use mock data.');
}

// ─── Analyze Wish with Oracle ─────────────────────────────────────────────────
exports.analyzeWish = catchAsync(async (req, res, next) => {
  const wish = await Wish.findById(req.params.wishId);
  if (!wish) return next(new AppError('Wish not found.', 404));

  if (wish.author.toString() !== req.user._id.toString()) {
    return next(new AppError('You can only get Oracle analysis for your own wishes.', 403));
  }

  // Return cached analysis if recent
  if (wish.aiAnalysis?.analyzedAt && (Date.now() - new Date(wish.aiAnalysis.analyzedAt)) < 24 * 60 * 60 * 1000) {
    return res.status(200).json({ status: 'success', data: { analysis: wish.aiAnalysis, cached: true } });
  }

  let analysis;

  if (openai && process.env.OPENAI_API_KEY) {
    try {
      const prompt = buildOraclePrompt(wish);
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are the Wish Oracle — a mystical, empathetic AI guide in the Wishing Lake of Smiles. 
You speak with warmth, wisdom, and a touch of magic. Your role is to help people understand and achieve their wishes.
Always respond in JSON format only.`,
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.8,
        max_tokens: 800,
        response_format: { type: 'json_object' },
      });

      analysis = JSON.parse(completion.choices[0].message.content);
    } catch (err) {
      logger.error(`OpenAI error: ${err.message}`);
      analysis = generateMockAnalysis(wish);
    }
  } else {
    analysis = generateMockAnalysis(wish);
  }

  // Save analysis to wish
  wish.aiAnalysis = {
    sentiment: analysis.sentiment || 'hopeful',
    tags: analysis.tags || [],
    suggestedActions: analysis.suggestedActions || [],
    oracleMessage: analysis.oracleMessage || '',
    analyzedAt: new Date(),
  };

  // Update emotion if AI suggests different
  if (analysis.detectedEmotion && wish.emotion !== analysis.detectedEmotion) {
    wish.emotion = analysis.detectedEmotion;
    wish.emotionScore = analysis.emotionScore || 0.5;
  }

  await wish.save({ validateBeforeSave: false });

  // Notify user
  await Notification.create({
    recipient: req.user._id,
    type: 'oracle_ready',
    title: '🔮 Your Oracle reading is ready',
    message: 'The Wish Oracle has analyzed your wish and has guidance for you.',
    data: { wishId: wish._id },
  });

  res.status(200).json({ status: 'success', data: { analysis: wish.aiAnalysis } });
});

// ─── Get Personalized Recommendations ────────────────────────────────────────
exports.getRecommendations = catchAsync(async (req, res) => {
  const userId = req.user._id;

  // Fetch user's recent wishes for context
  const userWishes = await Wish.find({ author: userId }).sort('-createdAt').limit(5).lean();

  // Find wishes user might want to fulfill
  const recommendations = await Wish.find({
    author: { $ne: userId },
    visibility: { $in: ['public', 'anonymous'] },
    status: 'active',
    isApproved: true,
  })
    .sort('-likeCount -createdAt')
    .limit(20)
    .populate('author', 'username displayName avatar')
    .lean();

  let personalizedRecommendations = recommendations;

  if (openai && process.env.OPENAI_API_KEY && userWishes.length > 0) {
    try {
      const prompt = `Based on this user's wishes: ${JSON.stringify(userWishes.map(w => ({ title: w.title, category: w.category, emotion: w.emotion })))}, 
      rank these wishes they might help with (return JSON with top 6 wish IDs in order): 
      ${JSON.stringify(recommendations.map(w => ({ _id: w._id, title: w.title, category: w.category })))}`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a wish-matching oracle. Return only JSON with a "wishIds" array.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.5,
        max_tokens: 200,
        response_format: { type: 'json_object' },
      });

      const ranked = JSON.parse(completion.choices[0].message.content);
      if (ranked.wishIds?.length > 0) {
        const rankMap = {};
        ranked.wishIds.forEach((id, idx) => { rankMap[id] = idx; });
        personalizedRecommendations = recommendations
          .filter(w => ranked.wishIds.includes(w._id.toString()))
          .sort((a, b) => (rankMap[a._id] || 99) - (rankMap[b._id] || 99));
      }
    } catch (err) {
      logger.error(`AI recommendations error: ${err.message}`);
    }
  }

  res.status(200).json({
    status: 'success',
    data: { recommendations: personalizedRecommendations.slice(0, 9) },
  });
});

// ─── Wish Oracle Chat (conversational) ────────────────────────────────────────
exports.oracleChat = catchAsync(async (req, res, next) => {
  const { message, context = [] } = req.body;

  if (!message || message.trim().length < 3) {
    return next(new AppError('Please provide a message for the Oracle.', 400));
  }

  const messages = [
    {
      role: 'system',
      content: `You are the Wish Oracle — an ancient, wise, and empathetic mystical guide 
who lives in the Wishing Lake of Smiles. You speak with warmth, poetry, and gentle wisdom. 
You help people clarify their wishes, understand their emotions, and find actionable paths forward. 
Keep responses concise (2-4 sentences max) but profound. Never break character.
The user's name is ${req.user.displayName}.`,
    },
    ...context.slice(-6).map(c => ({ role: c.role, content: c.content })),
    { role: 'user', content: message },
  ];

  let reply;

  if (openai && process.env.OPENAI_API_KEY) {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.9,
        max_tokens: 300,
      });
      reply = completion.choices[0].message.content;
    } catch (err) {
      logger.error(`Oracle chat error: ${err.message}`);
      reply = getOracleFallback();
    }
  } else {
    reply = getOracleFallback();
  }

  res.status(200).json({ status: 'success', data: { reply } });
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
const buildOraclePrompt = (wish) => `
Analyze this wish and return JSON with exactly these fields:
{
  "oracleMessage": "A mystical, personalized 2-3 sentence message for the wisher",
  "sentiment": "positive|negative|neutral|mixed",
  "detectedEmotion": "hopeful|sad|urgent|dreamy|joyful|anxious|grateful",
  "emotionScore": 0.0-1.0,
  "tags": ["array", "of", "3-5", "relevant", "tags"],
  "suggestedActions": ["3 specific, actionable steps to achieve this wish"],
  "feasibilityScore": 0-10,
  "category": "health|love|career|family|travel|education|financial|personal_growth|community|creative|other"
}

Wish Title: ${wish.title}
Wish Description: ${wish.description}
Category: ${wish.category}
Current Emotion: ${wish.emotion}
`;

const generateMockAnalysis = (wish) => ({
  oracleMessage: `The waters of this lake have heard your wish, ${wish.title.toLowerCase().includes('i want') ? 'dear wisher' : 'seeker of light'}. Your desire carries the weight of genuine hope, and the lake reflects it back to you threefold. Trust the journey ahead.`,
  sentiment: 'positive',
  detectedEmotion: wish.emotion || 'hopeful',
  emotionScore: 0.75,
  tags: [wish.category, wish.emotion, 'meaningful', 'achievable'],
  suggestedActions: [
    'Break this wish into three small, achievable milestones',
    'Share this wish with someone you trust who can offer support',
    'Set a timeline with gentle checkpoints to track your progress',
  ],
  feasibilityScore: 7,
  category: wish.category,
});

const getOracleFallback = () => {
  const fallbacks = [
    "The lake whispers that your question holds its own answer. Sit with it, and clarity will surface like moonlight on still water.",
    "Every wish begins with a single ripple of intention. What you seek is already seeking you — have patience, dear one.",
    "The Oracle sees your sincerity and honors it. Sometimes the greatest magic is simply believing in the possibility of change.",
  ];
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
};
