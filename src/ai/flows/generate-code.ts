'use server';
/**
 * @fileOverview A code generation flow.
 *
 * - generateCode - A function that generates code based on a prompt.
 * - GenerateCodeInput - The input type for the generateCode function.
 * - GenerateCodeOutput - The return type for the generateCode function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateCodeInputSchema = z.object({
  prompt: z.string().describe('The prompt to generate code from.'),
  language: z.string().describe('The programming language for the code.'),
});
export type GenerateCodeInput = z.infer<typeof GenerateCodeInputSchema>;

const GenerateCodeOutputSchema = z.object({
  code: z.string().describe('The generated code.'),
});
export type GenerateCodeOutput = z.infer<typeof GenerateCodeOutputSchema>;

export async function generateCode(input: GenerateCodeInput): Promise<GenerateCodeOutput> {
  return generateCodeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCodePrompt',
  input: {schema: GenerateCodeInputSchema},
  output: {schema: GenerateCodeOutputSchema},
  prompt: `You are an expert programmer and a helpful coding assistant. Your task is to generate clean, efficient, and correct code based on the user's request.

Follow these instructions carefully:
1.  Analyze the user's prompt to understand their requirements.
2.  Generate a complete, runnable program. Do not provide snippets or incomplete code.
3.  Generate code only in the specified language.
4.  Ensure the generated code is syntactically correct and follows the best practices for the given language.
5.  The output should contain ONLY the raw code. Do not include any explanations, comments, or markdown formatting like \`\`\`language ... \`\`\`.

Language: {{{language}}}
User Request: {{{prompt}}}
`,
});

const generateCodeFlow = ai.defineFlow(
  {
    name: 'generateCodeFlow',
    inputSchema: GenerateCodeInputSchema,
    outputSchema: GenerateCodeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
