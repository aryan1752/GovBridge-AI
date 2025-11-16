import dotenv from 'dotenv';
dotenv.config(); // Ensure env vars are loaded

import OpenAI from "openai";

// ✅ Instantiate OpenAI client - env vars are now loaded
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// ✅ Add validation to catch issues early
if (!process.env.OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY is missing in environment variables!');
}

export const chatbotReply = async (req, res) => {
  try {
    const userMsg = req.body.message;

    if (!userMsg) {
      return res.status(400).json({ error: "Message is required" });
    }

    console.log('🤖 Processing chatbot request...');

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an expert legal assistant for NyayBharat Law Firm. Provide clear, concise legal guidance based on Indian law."
        },
        { role: "user", content: userMsg }
      ]
    });

    console.log('✅ Chatbot response generated');

    res.json({
      success: true,
      reply: completion.choices[0].message.content
    });

  } catch (error) {
    console.error("❌ Chatbot Error:", error.message);
    res.status(500).json({
      success: false,
      error: "Chatbot failed. Please try again."
    });
  }
};