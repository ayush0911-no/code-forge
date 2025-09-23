'use server';
/**
 * @fileOverview A code generation and question answering flow.
 *
 * - generateCode - A function that generates code or answers questions based on a prompt.
 * - GenerateCodeInput - The input type for the generateCode function.
 * - GenerateCodeOutput - The return type for the generateCode function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateCodeInputSchema = z.object({
  prompt: z.string().describe('The prompt to generate code or answer a question from.'),
  language: z.string().describe('The programming language for the code context.'),
});
export type GenerateCodeInput = z.infer<typeof GenerateCodeInputSchema>;

const GenerateCodeOutputSchema = z.object({
  code: z.string().describe('The generated code or the answer to the question.'),
});
export type GenerateCodeOutput = z.infer<typeof GenerateCodeOutputSchema>;

export async function generateCode(input: GenerateCodeInput): Promise<GenerateCodeOutput> {
  return generateCodeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCodePrompt',
  input: {schema: GenerateCodeInputSchema},
  output: {schema: GenerateCodeOutputSchema},
  prompt: `You are an expert programmer and a helpful coding assistant. Your task is to either generate code or answer a question based on the user's request.

Follow these instructions carefully:
1.  Analyze the user's prompt to understand their requirements.
2.  **Determine if the user is asking a question or requesting code.**
    - If the user is asking a question (e.g., "how do I...", "what is...", "explain..."), provide a clear, concise natural language answer.
    - If the user is requesting code generation, generate a complete, runnable program. Do not provide snippets or incomplete code.
3.  When generating code, unless the user explicitly asks for a function (e.g., using keywords like 'function', 'def', 'method'), generate a script that can be executed directly.
4.  When generating code, ensure it is in the specified language.
5.  Ensure any generated code is syntactically correct and follows best practices.
6.  When generating code, the output should contain ONLY the raw code. Do not include any explanations, comments, or markdown formatting like \`\`\`language ... \`\`\`.
7.  **Crucially, ensure all code is properly formatted with correct indentation and newlines. The output must not be a single line of code.**

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
