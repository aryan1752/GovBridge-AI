// app/api/simplify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { text, translate } = await req.json();

    const prompt = translate
      ? `You are a helpful assistant that simplifies complex government/legal documents into plain language that a common person can understand. Simplify the following text and translate it to Hindi. Use simple words and short sentences. Include what the person needs to do if there are action items.

Original text:
${text}

Provide the simplified Hindi version:`
      : `You are a helpful assistant that simplifies complex government/legal documents into plain language. Simplify the following text. Use simple words and short sentences. Include what the person needs to do if there are action items.

Original text:
${text}

Provide the simplified version:`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 500,
    });

    const simplified = completion.choices[0].message.content;

    return NextResponse.json({ simplified });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to simplify text' },
      { status: 500 }
    );
  }
}