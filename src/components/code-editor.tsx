"use client";

import { useState, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { runCode, RunCodeOutput } from '@/ai/flows/run-code';
import { generateCode } from '@/ai/flows/generate-code';
import { languages, type Language } from '@/lib/languages';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Hammer, Download, Trash2, LoaderCircle, Play, Sparkles, Copy, FileText } from "lucide-react";
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/theme-toggle';

export function CodeEditor() {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState(languages[0].value);
  const [output, setOutput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const [userInput, setUserInput] = useState('');
  const [isAwaitingInput, setIsAwaitingInput] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isAnswer, setIsAnswer] = useState(false);
  const [imageOutput, setImageOutput] = useState('');


  const selectedLanguage = useMemo(() => languages.find(l => l.value === language) || languages[0], [language]);

  const handleRunCode = useCallback(async () => {
    if (code.trim() === '') {
      setOutput('');
      setImageOutput('');
      return;
    }
    setIsLoading(true);
    setIsAwaitingInput(false);
    setOutput(''); // Clear previous output before new run
    setImageOutput('');

    try {
      const result: RunCodeOutput = await runCode({
        code,
        language,
      });

      if (result.image) {
        setImageOutput(result.image);
      }
      
      let newOutput = result.output;

      const requiresInput = newOutput.includes("input()");
      if (requiresInput) {
        const parts = newOutput.split("input()");
        setOutput(parts[0]);
        setIsAwaitingInput(true);
      } else {
        setOutput(newOutput);
      }

    } catch (error) {
      console.error("Code execution failed:", error);
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
      toast({
        variant: "destructive",
        title: "Execution Error",
        description: `Could not run code. ${errorMessage}`,
      });
      setOutput(prev => `${prev}\nError: ${errorMessage}`);
    } finally {
      setIsLoading(false);
      if(!isAwaitingInput) {
        setUserInput('');
      }
    }
  }, [code, language, toast]);

  const handleGenerateCode = async () => {
    if (aiPrompt.trim() === '') return;
    setIsGenerating(true);
    setGeneratedContent('');
    setIsAnswer(false);
    try {
      const result = await generateCode({ prompt: aiPrompt, language });
      setGeneratedContent(result.code);
      const isCode = /^\s*```/.test(result.code) || /^\s*import/.test(result.code) || /^\s*(class|def|for|while|if)\s/.test(result.code) || result.code.includes('public static void main');
      setIsAnswer(!isCode);
    } catch (error) {
      console.error("Code generation failed:", error);
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
      toast({
        variant: "destructive",
        title: "Generation Error",
        description: `Could not generate code. ${errorMessage}`,
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleAcceptSuggestion = () => {
    setCode(generatedContent);
    setGeneratedContent('');
    setIsAnswer(false);
  };

  const handleDeclineSuggestion = () => {
    setGeneratedContent('');
    setIsAnswer(false);
  };

  const handleCopyAnswer = () => {
    navigator.clipboard.writeText(generatedContent);
    toast({
      title: "Copied to clipboard",
      description: "The AI's answer has been copied to your clipboard.",
    });
  };

  const handleDownloadAnswer = () => {
    const blob = new Blob([generatedContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai_answer.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownload = useCallback(() => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `codeforge_file.${selectedLanguage.extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [code, selectedLanguage]);

  const handleClear = () => {
    setCode('');
    setOutput('');
    setImageOutput('');
    setUserInput('');
    setIsAwaitingInput(false);
  };
  
  const handleInputSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isAwaitingInput) {
      const fullCode = code.replace(/input\(\)/, `"${userInput}"`);
      runCodeWithInput(fullCode);
    }
  };

  const runCodeWithInput = async (fullCode: string) => {
    setIsLoading(true);
    try {
      const result: RunCodeOutput = await runCode({
        code: fullCode,
        language,
      });
      if(result.image) {
        setImageOutput(result.image);
      }
      setOutput(prev => `${prev}${userInput}\n${result.output}\n`);
    } catch (error) {
       console.error("Code execution failed:", error);
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
      toast({
        variant: "destructive",
        title: "Execution Error",
        description: `Could not run code. ${errorMessage}`,
      });
      setOutput(prev => `${prev}\nError: ${errorMessage}`);
    } finally {
      setIsLoading(false);
      setIsAwaitingInput(false);
      setUserInput('');
    }
  }

  return (
    <>
      <Card className="w-full max-w-6xl shadow-2xl">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <Hammer className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="font-headline text-3xl">CodeForge</CardTitle>
                <CardDescription>Your AI-powered coding companion.</CardDescription>
              </div>
            </div>
            <div className="flex w-full sm:w-auto items-center gap-2">
              <ThemeToggle />
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={handleDownload} aria-label="Download code">
                <Download className="h-4 w-4" />
              </Button>
              <Button variant="destructive" size="icon" onClick={handleClear} aria-label="Clear editor">
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button onClick={() => handleRunCode()} disabled={isLoading || isGenerating}>
                {isLoading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                Run Code
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-4">
              <div className="space-y-2 flex-grow flex flex-col">
                  <Label htmlFor="code-input" className="text-sm font-semibold">Your Code</Label>
                  <Textarea
                      id="code-input"
                      placeholder={`// Start writing your ${selectedLanguage.label} code here...`}
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="min-h-[250px] font-code text-sm resize-y flex-grow"
                  />
              </div>
               <div className="space-y-2">
                <Label htmlFor="ai-prompt" className="text-sm font-semibold">AI Assistant</Label>
                <div className="flex gap-2">
                  <Input
                    id="ai-prompt"
                    placeholder="Ask a question or describe the code to generate..."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleGenerateCode()}
                  />
                  <Button onClick={handleGenerateCode} disabled={isGenerating || isLoading}>
                    {isGenerating ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    Generate
                  </Button>
                </div>
              </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="code-output" className="text-sm font-semibold">Output</Label>
            <div id="code-output" className="relative min-h-[250px] h-full w-full overflow-auto rounded-lg border bg-secondary/30 p-4 font-code text-sm">
              {(isLoading && !isAwaitingInput) || (isGenerating && !generatedContent) ? (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
                  <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
                  <p className="mt-2 text-sm text-muted-foreground">{isGenerating ? 'Generating response...' : 'Running code...'}</p>
                </div>
              ): null}
              
              {imageOutput && <Image src={imageOutput} alt="Generated plot" width={400} height={300} />}
              <pre className="whitespace-pre-wrap break-words"><code className={output.includes('Error:') ? 'text-destructive' : ''}>{output}</code></pre>
              
              {isAwaitingInput && (
                <form onSubmit={handleInputSubmit} className="mt-2 flex items-center gap-2">
                  <Input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Enter input and press Enter"
                    className="flex-grow bg-background/70"
                    autoFocus
                  />
                   <Button type="submit" size="sm" disabled={isLoading}>Submit</Button>
                </form>
              )}

              {!isLoading && !output && !isAwaitingInput && !imageOutput && (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  Code output will appear here.
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      <Dialog open={!!generatedContent} onOpenChange={(isOpen) => !isOpen && setGeneratedContent('')}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isAnswer ? 'AI Answer' : 'AI Code Suggestion'}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-auto rounded-md border bg-secondary/30 p-4">
              <pre className="whitespace-pre-wrap break-words font-code text-sm">{generatedContent}</pre>
          </div>
          <DialogFooter className="sm:justify-between">
            {isAnswer ? (
              <div className="flex gap-2">
                 <Button variant="outline" onClick={handleCopyAnswer}><Copy className="mr-2" /> Copy</Button>
                 <Button variant="outline" onClick={handleDownloadAnswer}><FileText className="mr-2" /> Download</Button>
              </div>
            ) : (
               <Button variant="outline" onClick={handleDeclineSuggestion}>Decline</Button>
            )}

            {isAnswer ? (
               <Button onClick={handleDeclineSuggestion}>Close</Button>
            ) : (
               <Button onClick={handleAcceptSuggestion}>Accept</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
