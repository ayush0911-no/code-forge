'use server';
/**
 * @fileOverview A code execution simulation flow.
 *
 * - runCode - A function that simulates running code and returns its output.
 * - RunCodeInput - The input type for the runCode function.
 * - RunCodeOutput - The return type for the runCode function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RunCodeInputSchema = z.object({
  code: z.string().describe('The code to run.'),
  language: z.string().describe('The programming language of the code.'),
  stdin: z.string().optional().describe('The standard input to provide to the code.'),
});
export type RunCodeInput = z.infer<typeof RunCodeInputSchema>;

const RunCodeOutputSchema = z.object({
  output: z.string().describe('The output of the code execution.'),
});
export type RunCodeOutput = z.infer<typeof RunCodeOutputSchema>;

export async function runCode(input: RunCodeInput): Promise<RunCodeOutput> {
  return runCodeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'runCodePrompt',
  input: {schema: RunCodeInputSchema},
  output: {schema: RunCodeOutputSchema},
  prompt: `You are a code execution engine. Given the following code and language, execute it and return the output.
If the code has syntax errors or would cause a runtime error, return an error message as the output.
{{#if stdin}}
The code will be provided with the following standard input:
\`\`\`
{{{stdin}}}
\`\`\`
{{/if}}

Language: {{{language}}}
Code:
\`\`\`{{{language}}}
{{{code}}}
\`\`\`

Return only the output of the code as if it were run in a console.
`,
});

const runCodeFlow = ai.defineFlow(
  {
    name: 'runCodeFlow',
    inputSchema: RunCodeInputSchema,
    outputSchema: RunCodeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
