import { toast } from 'react-hot-toast';

const GEMINI_API_KEY = (import.meta as any).env
  .VITE_GEMINI_API_KEY as string | undefined;

if (!GEMINI_API_KEY) {
  // eslint-disable-next-line no-console
  console.warn(
    'VITE_GEMINI_API_KEY is not set. The AI assistant will be disabled until it is configured.',
  );
}

export interface AssistantMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AskAssistantOptions {
  eventsContext?: string;
  history?: AssistantMessage[];
}

export async function askAssistant(
  userInput: string,
  options: AskAssistantOptions = {},
): Promise<string> {
  if (!GEMINI_API_KEY) {
    toast.error('AI assistant is not configured yet.');
    throw new Error('Missing VITE_GEMINI_API_KEY');
  }

  const { eventsContext, history = [] } = options;

  const systemPrompt =
    'You are the Burgasys AI assistant for a student- and organization-focused events platform in Burgas, Bulgaria. ' +
    'Help users discover relevant events, manage their participation, and understand how to use the site. ' +
    'Be concise, friendly, and avoid making up data that is not provided in the context.';

  const historyText =
    history.length > 0
      ? '\n\nConversation so far:\n' +
        history
          .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
          .join('\n')
      : '';

  const eventsText = eventsContext
    ? '\n\nHere is a list of upcoming events from the database. Use them for concrete, personalized recommendations when relevant, but do not invent events that are not listed:\n' +
      eventsContext
    : '';

  const fullPrompt =
    `${systemPrompt}${eventsText}${historyText}\n\nUser: ${userInput}\nAssistant:`.slice(
      0,
      28000,
    );

  const response = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=' +
      encodeURIComponent(GEMINI_API_KEY),
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: fullPrompt }],
          },
        ],
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    // eslint-disable-next-line no-console
    console.error('Gemini API error:', response.status, errorText);
    toast.error('The AI assistant could not respond right now.');
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data: any = await response.json();
  const text =
    data?.candidates?.[0]?.content?.parts?.[0]?.text ||
    data?.candidates?.[0]?.output_text ||
    null;

  if (!text) {
    toast.error('The AI assistant returned an empty response.');
    throw new Error('Empty response from Gemini');
  }

  return text.trim();
}

