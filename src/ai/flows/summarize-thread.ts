// Summarizes a discussion thread to provide a quick overview of key points and arguments.

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeThreadInputSchema = z.object({
  threadContent: z
    .string()
    .describe('The complete content of the discussion thread to be summarized.'),
});

export type SummarizeThreadInput = z.infer<typeof SummarizeThreadInputSchema>;

const SummarizeThreadOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the key points and arguments in the thread.'),
});

export type SummarizeThreadOutput = z.infer<typeof SummarizeThreadOutputSchema>;

export async function summarizeThread(input: SummarizeThreadInput): Promise<SummarizeThreadOutput> {
  return summarizeThreadFlow(input);
}

const summarizeThreadPrompt = ai.definePrompt({
  name: 'summarizeThreadPrompt',
  input: {schema: SummarizeThreadInputSchema},
  output: {schema: SummarizeThreadOutputSchema},
  prompt: `Summarize the following discussion thread, extracting the key points and main arguments.  Provide a concise overview that captures the essence of the discussion:\n\n{{{threadContent}}}`,
});

const summarizeThreadFlow = ai.defineFlow(
  {
    name: 'summarizeThreadFlow',
    inputSchema: SummarizeThreadInputSchema,
    outputSchema: SummarizeThreadOutputSchema,
  },
  async input => {
    const {output} = await summarizeThreadPrompt(input);
    return output!;
  }
);
