'use server';
/**
 * @fileOverview A code summarization flow.
 *
 * - summarizeCode - A function that generates a short, descriptive name for a code snippet.
 * - SummarizeCodeInput - The input type for the summarizeCode function.
 * - SummarizeCodeOutput - The return type for the summarizeCode function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeCodeInputSchema = z.object({
  code: z.string().describe('The code to summarize.'),
  language: z.string().describe('The programming language of the code.'),
});
export type SummarizeCodeInput = z.infer<typeof SummarizeCodeInputSchema>;

const SummarizeCodeOutputSchema = z.object({
  name: z.string().describe('A short, descriptive name for the code (3-5 words max).'),
});
export type SummarizeCodeOutput = z.infer<typeof SummarizeCodeOutputSchema>;

export async function summarizeCode(input: SummarizeCodeInput): Promise<SummarizeCodeOutput> {
  return summarizeCodeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeCodePrompt',
  input: {schema: SummarizeCodeInputSchema},
  output: {schema: SummarizeCodeOutputSchema},
  prompt: `You are an expert programmer. Your task is to analyze a code snippet and provide a short, descriptive name for it. The name should be at most 5 words and summarize the code's purpose.

Examples:
- "Check for palindrome number"
- "Simple web server"
- "Fibonacci sequence generator"
- "Read and print file contents"

Language: {{{language}}}

Code:
\`\`\`{{{language}}}
{{{code}}}
\`\`\`

Generate a descriptive name for the code above.
`,
});

const summarizeCodeFlow = ai.defineFlow(
  {
    name: 'summarizeCodeFlow',
    inputSchema: SummarizeCodeInputSchema,
    outputSchema: SummarizeCodeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
