'use server';

/**
 * @fileOverview This file defines a Genkit flow for providing code autocompletion suggestions based on the selected language.
 *
 * - codeAutoCompletion - A function that generates code completion suggestions.
 * - CodeAutoCompletionInput - The input type for the codeAutoCompletion function.
 * - CodeAutoCompletionOutput - The return type for the codeAutoCompletion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CodeAutoCompletionInputSchema = z.object({
  language: z.string().describe('The programming language for which to provide code completions.'),
  codeSnippet: z.string().describe('The current code snippet the user is typing.'),
});
export type CodeAutoCompletionInput = z.infer<typeof CodeAutoCompletionInputSchema>;

const CodeAutoCompletionOutputSchema = z.object({
  completionSuggestions: z.array(z.string()).describe('An array of code completion suggestions.'),
});
export type CodeAutoCompletionOutput = z.infer<typeof CodeAutoCompletionOutputSchema>;

export async function codeAutoCompletion(input: CodeAutoCompletionInput): Promise<CodeAutoCompletionOutput> {
  return codeAutoCompletionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'codeAutoCompletionPrompt',
  input: {schema: CodeAutoCompletionInputSchema},
  output: {schema: CodeAutoCompletionOutputSchema},
  prompt: `You are a code autocompletion assistant. Given the programming language and the current code snippet, provide a list of code completion suggestions.

Language: {{{language}}}
Code Snippet:
{{codeSnippet}}

Completion Suggestions:`,
});

const codeAutoCompletionFlow = ai.defineFlow(
  {
    name: 'codeAutoCompletionFlow',
    inputSchema: CodeAutoCompletionInputSchema,
    outputSchema: CodeAutoCompletionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
