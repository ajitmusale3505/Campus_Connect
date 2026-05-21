'use server';

/**
 * @fileOverview Implements the AI chatbot flow for students to get quick answers to their questions.
 *
 * - aiChatbotStudent - A function that handles the AI chatbot process for students.
 * - AIChatbotStudentInput - The input type for the aiChatbotStudent function.
 * - AIChatbotStudentOutput - The return type for the aiChatbotStudent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const AIChatbotStudentInputSchema = z.object({
  userId: z.string().describe('The ID of the student asking the question.'),
  message: z.string().describe('The question asked by the student.'),
  context: z.string().optional().describe('Any additional context for the question.'),
});
export type AIChatbotStudentInput = z.infer<typeof AIChatbotStudentInputSchema>;

const AIChatbotStudentOutputSchema = z.string().describe('The response text from the AI chatbot.');

export type AIChatbotStudentOutput = z.infer<typeof AIChatbotStudentOutputSchema>;

export async function aiChatbotStudent(input: AIChatbotStudentInput): Promise<AIChatbotStudentOutput> {
  return aiChatbotStudentFlow(input);
}

const aiChatbotStudentPrompt = `You are a helpful AI chatbot assisting students with their questions. Provide clear and concise answers.

User ID: {{userId}}
Question: {{message}}
{{#if context}}
Context: {{{context}}}
{{/if}}

Response:`;

const aiChatbotStudentFlow = ai.defineFlow(
  {
    name: 'aiChatbotStudentFlow',
    inputSchema: AIChatbotStudentInputSchema,
    outputSchema: AIChatbotStudentOutputSchema,
  },
  async (input: AIChatbotStudentInput) => {
    const { text } = await ai.generate({
      prompt: aiChatbotStudentPrompt,
      model: 'googleai/gemini-2.5-flash',
      history: [
        {
          role: 'user',
          content: [
            { text: `User ID: ${input.userId}` },
            { text: `Question: ${input.message}` },
          ],
        },
      ],
    });
    return text;
  }
);
