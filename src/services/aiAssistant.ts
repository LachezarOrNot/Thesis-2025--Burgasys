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
  /**
   * Optional role of the currently logged-in user.
   * Used to tell the model that only admins
   * can trigger automatic event creation.
   */
  userRole?: string;
}

export async function askAssistant(
  userInput: string,
  options: AskAssistantOptions = {},
): Promise<string> {
  if (!GEMINI_API_KEY) {
    toast.error('AI assistant is not configured yet.');
    throw new Error('Missing VITE_GEMINI_API_KEY');
  }

  const { eventsContext, history = [], userRole } = options;

  const systemPrompt =
    'You are the Burgasys AI assistant for a student- and organization-focused events platform in Burgas, Bulgaria. ' +
    'Help users discover relevant events, manage their participation, and understand how to use the site. ' +
    'Respond in the same language the user used. ' +
    'Do NOT use Markdown formatting like **bold**, numbered lists, or bullet lists – answer in plain text sentences only. ' +
    'Avoid always starting responses with the same greeting like "Hello" or "Здравейте"; vary your openings and often skip a greeting altogether. ' +
    'Be concise, friendly, and never invent events or data that are not provided in the context. ' +
    'You cannot access the database directly. However, when an ADMIN user explicitly asks you to CREATE A NEW EVENT and has already provided ALL of the following fields: ' +
    'name, description, location, start date/time, end date/time (formatted exactly as YYYY-MM-DDTHH:MM, for example 2026-05-21T18:30), optional capacity (number), optional tags (list of strings), and optional allow_registration (true/false), ' +
    'you must answer ONLY with a single JSON object on one line, in this exact shape and nothing else: ' +
    '{"action":"create_event","name":"...","description":"...","location":"...","start_datetime":"YYYY-MM-DDTHH:MM","end_datetime":"YYYY-MM-DDTHH:MM","capacity":123,"tags":["tag1","tag2"],"allow_registration":true}. ' +
    'If ANY of these required fields are missing or ambiguous in the user request, do NOT output JSON; instead, respond with normal plain text asking clear follow-up questions to collect the missing details, and only after that, when everything is specified, return the JSON.';

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

  const roleText = userRole
    ? `\n\nThe currently logged-in user has role "${userRole}". Only users with role "admin" are allowed to have events created automatically from your JSON response. For any other role, you must not attempt to create events and should instead explain how they can request one via the usual interface.`
    : '';

  const fullPrompt =
    `${systemPrompt}${eventsText}${roleText}${historyText}\n\nUser: ${userInput}\nAssistant:`.slice(
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

