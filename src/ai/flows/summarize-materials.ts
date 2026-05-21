// Summarize materials for students to quickly understand the main points.

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const SummarizeMaterialsInputSchema = z.object({
  material: z.string().describe('The material to be summarized.'),
});

export type SummarizeMaterialsInput = z.infer<typeof SummarizeMaterialsInputSchema>;

const SummarizeMaterialsOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the material.'),
});

export type SummarizeMaterialsOutput = z.infer<typeof SummarizeMaterialsOutputSchema>;

export async function summarizeMaterials(input: SummarizeMaterialsInput): Promise<SummarizeMaterialsOutput> {
  return summarizeMaterialsFlow(input);
}

const summarizeMaterialsPrompt = ai.definePrompt({
  name: 'summarizeMaterialsPrompt',
  input: {schema: SummarizeMaterialsInputSchema},
  output: {schema: SummarizeMaterialsOutputSchema},
  prompt: `Summarize the following material in a concise manner:\n\n{{{material}}}`, 
});

const summarizeMaterialsFlow = ai.defineFlow(
  {
    name: 'summarizeMaterialsFlow',
    inputSchema: SummarizeMaterialsInputSchema,
    outputSchema: SummarizeMaterialsOutputSchema,
  },
  async (input: SummarizeMaterialsInput) => {
    const {output} = await summarizeMaterialsPrompt(input);
    return output!;
  }
);
