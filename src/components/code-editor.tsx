"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
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

const CustomDownloadIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    {...props}
  >
    <path
      fill="#4285F4"
      d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z"
    />
    <path fill="#FFFFFF" d="M13 3.5V9H18.5L13 3.5Z" opacity="0.3" />
    <path fill="#212121" d="M12 19C14.21 19 16 17.21 16 15C16 12.79 14.21 11 12 11S8 12.79 8 15C8 17.21 9.79 19 12 19Z" opacity="0.8"/>
    <path fill="#FFFFFF" d="M12.5 13H11.5V15.5L10.21 14.21L9.5 14.92L12 17.41L14.5 14.92L13.79 14.21L12.5 15.5V13Z" />
    <path fill="#FFFFFF" d="M9.4 12L8 13.4L9.4 14.8L10.8 13.4L9.4 12Z" />
    <path fill="#FFFFFF" d="M14.6 12L13.2 13.4L14.6 14.8L16 13.4L14.6 12Z" />
  </svg>
);


export function CodeEditor() {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState(languages[0].value);
  const [output, setOutput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const [aiPrompt, setAiPrompt] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isAnswer, setIsAnswer] = useState(false);
  const [imageOutput, setImageOutput] = useState('');
  const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);
  const [lineCount, setLineCount] = useState(1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const lines = code.split('\n').length;
    setLineCount(lines);
  }, [code]);

  const handleTextareaScroll = () => {
    if (lineNumbersRef.current && textareaRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };
  
  const selectedLanguage = useMemo(() => languages.find(l => l.value === language) || languages[0], [language]);

  const handleRunCode = useCallback(async () => {
    if (code.trim() === '') {
      setOutput('');
      setImageOutput('');
      return;
    }
    setIsLoading(true);
    setOutput('');
    setImageOutput('');
    try {
      const result: RunCodeOutput = await runCode({
        code,
        language,
      });
      setOutput(result.output);
      if (result.image) {
        setImageOutput(result.image);
      }
    } catch (error) {
      console.error("Code execution failed:", error);
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
      toast({
        variant: "destructive",
        title: "Execution Error",
        description: `Could not run code. ${errorMessage}`,
      });
      setOutput(`Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
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
      
      const containsCodeKeywords = ['def ', 'class ', 'import ', 'public static void main', 'console.log', 'function', 'return', '#include', 'using namespace std'].some(kw => result.code.includes(kw));
      const looksLikeCode = /[{};=<>]/.test(result.code);
      const isCodeResponse = containsCodeKeywords || looksLikeCode;
      
      setGeneratedContent(result.code);
      setIsAnswer(!isCodeResponse);

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

  return (
    <>
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border/60 bg-background px-4 md:px-6">
        <div className="flex items-center gap-3">
          <Code className="h-7 w-7 text-primary" />
          <h1 className="text-xl font-bold tracking-tighter font-headline">codeforge</h1>
          <Dialog open={isAiDialogOpen} onOpenChange={setIsAiDialogOpen}>
            <DialogTrigger asChild>
              <Button><Sparkles className="mr-2 h-4 w-4" />AI Seva</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>AI Assistant</DialogTitle>
              </DialogHeader>
              <div className="flex flex-wrap gap-2 pt-2">
                {languages.map((lang) => (
                  <Button
                    key={lang.value}
                    variant={language === lang.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setLanguage(lang.value)}
                  >
                    {lang.label}
                  </Button>
                ))}
              </div>
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
          <Button variant="outline" size="sm" onClick={handleDownload}><CustomDownloadIcon className="mr-2" /> Download</Button>
          <Button variant="outline" size="sm" onClick={handleClearCode}><Trash2 className="mr-2" /> Clear</Button>
          <Button size="sm" onClick={() => handleRunCode()} disabled={isLoading || isGenerating}>
            {isLoading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
            Compile & Run
          </Button>
        </div>
      </header>
      
      <main className="flex-1 flex flex-col p-4 md:p-6 gap-6">
        <div className="flex flex-col gap-2 flex-grow-[2] basis-0">
          <h2 className="text-lg font-semibold tracking-tight">Code Editor</h2>
          <div className="flex-grow relative border border-border/60 rounded-lg overflow-hidden">
            <div ref={lineNumbersRef} className="absolute left-0 top-0 h-full overflow-hidden bg-secondary text-right pr-2 pt-2 select-none text-muted-foreground font-code text-sm" style={{ width: '40px' }}>
              {Array.from({ length: lineCount }, (_, i) => i + 1).map(i => <div key={i}>{i}</div>)}
            </div>
            <Textarea
              ref={textareaRef}
              id="code-input"
              placeholder={`# Start writing your ${selectedLanguage.label} code here...`}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onScroll={handleTextareaScroll}
              className="absolute inset-0 w-full h-full font-code text-sm resize-none bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              style={{ paddingLeft: '50px' }}
              spellCheck="false"
            />
          </div>
        </div>
        
        <div className="flex flex-col gap-2 flex-grow basis-0">
          <h2 className="text-lg font-semibold tracking-tight">Output</h2>
          <div id="code-output" className="relative flex-grow min-h-[150px] overflow-auto rounded-lg border border-border/60 bg-secondary dark:bg-zinc-900/80 p-4 font-code text-sm">
            {isLoading ? (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
                <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
                <p className="mt-2 text-sm text-muted-foreground">Running code...</p>
              </div>
            ): (
              <>
                {imageOutput && <Image src={imageOutput} alt="Generated plot" width={400} height={300} />}
                <pre className="whitespace-pre-wrap break-words"><code className={output.includes('Error:') ? 'text-destructive' : ''}>{output}</code></pre>
                {!output && !imageOutput && (
                  <div className="flex h-full items-start justify-start text-muted-foreground">
                    Output will be displayed here.
                  </div>
                )}
              </>
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
