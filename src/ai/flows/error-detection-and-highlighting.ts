'use server';
/**
 * @fileOverview Implements error detection and highlighting in code based on the selected language.
 *
 * - detectAndHighlightErrors - A function that takes code and language as input, and returns detected errors.
 * - DetectAndHighlightErrorsInput - The input type for the detectAndHighlightErrors function.
 * - DetectAndHighlightErrorsOutput - The return type for the detectAndHighlightErrors function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetectAndHighlightErrorsInputSchema = z.object({
  code: z.string().describe('The code to check for errors.'),
  language: z.string().describe('The programming language of the code.'),
});
export type DetectAndHighlightErrorsInput = z.infer<typeof DetectAndHighlightErrorsInputSchema>;

const DetectAndHighlightErrorsOutputSchema = z.object({
  errors: z.array(z.string()).describe('A list of errors found in the code.'),
  highlightedCode: z.string().describe('The code with errors highlighted.'),
});
export type DetectAndHighlightErrorsOutput = z.infer<typeof DetectAndHighlightErrorsOutputSchema>;

export async function detectAndHighlightErrors(input: DetectAndHighlightErrorsInput): Promise<DetectAndHighlightErrorsOutput> {
  return detectAndHighlightErrorsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'detectAndHighlightErrorsPrompt',
  input: {schema: DetectAndHighlightErrorsInputSchema},
  output: {schema: DetectAndHighlightErrorsOutputSchema},
  prompt: `You are a code error detection and highlighting tool. Given the following code and language, detect any errors and highlight them in the code. Return a list of errors and the highlighted code.

Language: {{{language}}}
Code:
\`\`\`{{{language}}}
{{{code}}}
\`\`\`

Return the errors found and the highlighted code.
Errors should be specific and include the line number if possible.  The highlighted code should visually indicate the error locations.
`,
});

const detectAndHighlightErrorsFlow = ai.defineFlow(
  {
    name: 'detectAndHighlightErrorsFlow',
    inputSchema: DetectAndHighlightErrorsInputSchema,
    outputSchema: DetectAndHighlightErrorsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
