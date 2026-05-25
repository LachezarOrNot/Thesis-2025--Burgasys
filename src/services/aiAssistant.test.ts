import { beforeEach, describe, expect, it, vi } from 'vitest';
import { askAssistant } from './aiAssistant';

vi.mock('react-hot-toast', () => ({
  toast: {
    error: vi.fn(),
  },
}));

describe('askAssistant', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns trimmed text from a successful Gemini response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: '  Hello from Burgasys  ' }],
              },
            },
          ],
        }),
      }),
    );

    const reply = await askAssistant('What events are near me?');
    expect(reply).toBe('Hello from Burgasys');
    expect(fetch).toHaveBeenCalled();
  });

  it('throws when the API responds with a non-retryable error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        text: async () => 'bad request',
      }),
    );

    await expect(askAssistant('Hi')).rejects.toThrow('Gemini API error: 400');
  });

  it('throws when the response has no text', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ candidates: [] }),
      }),
    );

    await expect(askAssistant('Hi')).rejects.toThrow('Empty response from Gemini');
  });
});
