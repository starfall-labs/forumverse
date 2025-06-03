
'use server';
/**
 * @fileOverview A Genkit flow for translating text to a target language.
 *
 * - translateText - A function that handles the text translation process.
 * - TranslateTextInput - The input type for the translateText function.
 * - TranslateTextOutput - The return type for the translateText function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TranslateTextInputSchema = z.object({
  textToTranslate: z.string().describe('The text content to be translated.'),
  targetLanguageCode: z.string().describe('The ISO 639-1 code for the target language (e.g., "vi" for Vietnamese, "es" for Spanish).'),
});
export type TranslateTextInput = z.infer<typeof TranslateTextInputSchema>;

const TranslateTextOutputSchema = z.object({
  translatedText: z.string().describe('The translated text.'),
});
export type TranslateTextOutput = z.infer<typeof TranslateTextOutputSchema>;

export async function translateText(input: TranslateTextInput): Promise<TranslateTextOutput> {
  return translateTextFlow(input);
}

const translateTextPrompt = ai.definePrompt({
  name: 'translateTextPrompt',
  input: {schema: TranslateTextInputSchema},
  output: {schema: TranslateTextOutputSchema},
  prompt: `Translate the following text into the language specified by the code '{{{targetLanguageCode}}}'.
Text to translate: "{{{textToTranslate}}}"

Return ONLY the translated text. Do not include any introductory phrases or explanations.`,
  config: {
    // Optional: You might want to adjust safety settings if translations are unexpectedly blocked.
    // safetySettings: [
    //   {
    //     category: 'HARM_CATEGORY_HATE_SPEECH',
    //     threshold: 'BLOCK_NONE',
    //   },
    // ],
  }
});

const translateTextFlow = ai.defineFlow(
  {
    name: 'translateTextFlow',
    inputSchema: TranslateTextInputSchema,
    outputSchema: TranslateTextOutputSchema,
  },
  async input => {
    const {output} = await translateTextPrompt(input);
    if (!output) {
      // Fallback or error handling if output is null/undefined
      // For simplicity, returning the original text, but you might throw an error
      console.warn(`Translation failed for text: "${input.textToTranslate}" to language: "${input.targetLanguageCode}". Output was null.`);
      return { translatedText: input.textToTranslate };
    }
    return output;
  }
);
