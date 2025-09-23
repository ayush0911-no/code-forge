"use client";

import { useState, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { runCode, RunCodeOutput } from '@/ai/flows/run-code';
import { generateCode } from '@/ai/flows/generate-code';
import { languages, type Language } from '@/lib/languages';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Code, Download, LoaderCircle, Play, Sparkles, Copy, FileText, Trash2 } from "lucide-react";
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
  const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);

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
    setIsAiDialogOpen(false);
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
    setAiPrompt('');
  };

  const handleDeclineSuggestion = () => {
    setGeneratedContent('');
    setIsAnswer(false);
    setAiPrompt('');
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

  const handleClearCode = () => {
    setCode('');
    setOutput('');
    setImageOutput('');
  }
  
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
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border/60 bg-background px-4 md:px-6">
        <div className="flex items-center gap-3">
          <Code className="h-7 w-7 text-primary" />
          <h1 className="text-xl font-bold tracking-tighter font-headline">codeforge</h1>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="w-[120px] h-9 text-sm">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              {languages.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ThemeToggle />
          <Button variant="outline" size="sm" onClick={handleDownload}><Download className="mr-2" /> Download</Button>
          <Button variant="outline" size="sm" onClick={handleClearCode}><Trash2 className="mr-2" /> Clear</Button>
          <Button size="sm" onClick={() => handleRunCode()} disabled={isLoading || isGenerating}>
            {isLoading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
            Compile & Run
          </Button>
          <Dialog open={isAiDialogOpen} onOpenChange={setIsAiDialogOpen}>
            <DialogTrigger asChild>
              <Button>AI Seva</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>AI Assistant</DialogTitle>
              </DialogHeader>
                <Label htmlFor="ai-prompt" className="sr-only">AI Assistant</Label>
                <Input
                  id="ai-prompt"
                  placeholder="Ask a question or describe the code to generate..."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerateCode()}
                />
              <DialogFooter>
                <Button onClick={handleGenerateCode} disabled={isGenerating || isLoading}>
                  {isGenerating ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  Generate
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>
      
      <main className="flex-1 flex flex-col p-4 md:p-6 gap-6">
        <div className="flex flex-col gap-2 flex-grow-[2] basis-0">
          <h2 className="text-lg font-semibold tracking-tight">Code Editor</h2>
          <div className="flex-grow relative">
            <Textarea
              id="code-input"
              placeholder={`# Start writing your ${selectedLanguage.label} code here...`}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="absolute inset-0 w-full h-full font-code text-sm resize-none bg-zinc-900/50 dark:bg-zinc-900/80 border-border/60"
            />
          </div>
        </div>
        
        <div className="flex flex-col gap-2 flex-grow basis-0">
          <h2 className="text-lg font-semibold tracking-tight">Output</h2>
          <div id="code-output" className="relative flex-grow min-h-[150px] overflow-auto rounded-lg border border-border/60 bg-zinc-900/50 dark:bg-zinc-900/80 p-4 font-code text-sm">
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
              <div className="flex h-full items-start justify-start text-muted-foreground">
                Output will be displayed here.
              </div>
            )}
          </div>
        </div>
      </main>

      <Dialog open={!!generatedContent} onOpenChange={(isOpen) => !isOpen && handleDeclineSuggestion()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isAnswer ? 'AI Answer' : 'AI Code Suggestion'}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-auto rounded-md border bg-secondary/30 p-4">
              <pre className="whitespace-pre-wrap font-code text-sm">{generatedContent}</pre>
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
