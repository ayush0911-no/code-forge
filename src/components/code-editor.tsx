"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import Image from 'next/image';
import { runCode, RunCodeOutput } from '@/ai/flows/run-code';
import { generateCode } from '@/ai/flows/generate-code';
import { summarizeCode } from '@/ai/flows/summarize-code';
import { languages, type Language, defaultCode } from '@/lib/languages';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Code, Download, LoaderCircle, Play, Sparkles, Copy, FileText, Trash2, History, RotateCcw, Send } from "lucide-react";
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/theme-toggle';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

type HistoryItem = {
  code: string;
  language: string;
  name: string;
};

const CustomDownloadIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z"
        fill="#FFDDC5"
      ></path>
      <path d="M20 8H14C13.4 8 13 7.6 13 7V2L20 8Z" fill="#F9A465"></path>
      <path
        d="M12 19C14.2091 19 16 17.2091 16 15C16 12.7909 14.2091 11 12 11C9.79086 11 8 12.7909 8 15C8 17.2091 9.79086 19 12 19Z"
        fill="#4285F4"
      ></path>
      <path
        d="M12.5 13H11.5V15.5L10.2071 14.2071L9.5 14.9142L12 17.4142L14.5 14.9142L13.7929 14.2071L12.5 15.5V13Z"
        fill="white"
      ></path>
    </svg>
);


export function CodeEditor() {
  const [language, setLanguage] = useState(languages[0].value);
  const [code, setCode] = useState(defaultCode[language] || '');
  const [output, setOutput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const [aiPrompt, setAiPrompt] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isAnswer, setIsAnswer] = useState(false);
  const [imageOutput, setImageOutput] = useState('');
  const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [lineCount, setLineCount] = useState(1);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  const [sessionHistory, setSessionHistory] = useState<string[]>([]);
  const [isAwaitingInput, setIsAwaitingInput] = useState(false);
  const [interactiveInput, setInteractiveInput] = useState('');


  useEffect(() => {
    if (outputRef.current) {
        outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output, imageOutput, isLoading]);

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

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    if (code.trim() === '' || code === defaultCode[language]) {
      setCode(defaultCode[newLanguage] || '');
    }
  };

  const executeCode = useCallback(async (currentInput?: string) => {
    if (code.trim() === '') {
      setOutput('');
      setImageOutput('');
      return;
    }
    setIsLoading(true);
    
    try {
      const result = await runCode({
        code,
        language,
        input: currentInput,
        sessionHistory: currentInput ? sessionHistory : [],
      });

      setOutput(result.output);
      setSessionHistory(result.sessionHistory || []);
      setIsAwaitingInput(result.isAwaitingInput || false);

      if (result.image) {
        setImageOutput(result.image);
      } else {
        setImageOutput('');
      }

      return result;
    } catch (error) {
      console.error("Code execution failed:", error);
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
      toast({
        variant: "destructive",
        title: "Execution Error",
        description: `Could not run code. ${errorMessage}`,
      });
      setOutput(prev => `${prev}\nError: ${errorMessage}`);
      setIsAwaitingInput(false);
    } finally {
      setIsLoading(false);
    }
  }, [code, language, sessionHistory, toast]);

  const handleRunCode = useCallback(async () => {
    setOutput('');
    setImageOutput('');
    setSessionHistory([]);
    setIsAwaitingInput(false);
    
    const executionPromise = executeCode();
    
    summarizeCode({ code, language }).then(summaryResult => {
      setHistory(prev => [{ code, language, name: summaryResult.name }, ...prev.slice(0, 49)]);
    }).catch(error => {
      console.error("Code summarization failed:", error);
      setHistory(prev => [{ code, language, name: 'Untitled' }, ...prev.slice(0, 49)]);
    });

    await executionPromise;

  }, [code, language, executeCode]);


  const handleInteractiveInput = async () => {
    if (interactiveInput.trim() === '') return;
    setOutput(prev => `${prev}${interactiveInput}\n`);
    await executeCode(interactiveInput);
    setInteractiveInput('');
  };

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
    a.download = `CodeForge_file.${selectedLanguage.extension}`;
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

  const handleRestoreHistory = (item: HistoryItem) => {
    setCode(item.code);
    setLanguage(item.language);
    setIsHistoryDialogOpen(false);
  };

  return (
    <>
    <div
        className="absolute inset-0 -z-10 h-full w-full bg-cover bg-center"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1542401886-65d6c61db217?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",
        }}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
    </div>
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 bg-black/30 px-4 md:px-6">
        <div className="flex items-center gap-3">
          <Code className="h-7 w-7 text-primary" />
          <h1 className="text-xl font-bold tracking-tighter font-headline text-white">CodeForge</h1>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
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

          <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
            <DialogTrigger asChild>
                <Button variant="outline"><History className="mr-2 h-4 w-4" />History</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Code History</DialogTitle>
              </DialogHeader>
                <div className="flex items-center justify-end">
                    <Button variant="outline" size="sm" onClick={() => setHistory([])} disabled={history.length === 0}><Trash2 className="mr-2"/> Clear History</Button>
                </div>
                <div id="code-history" className="relative flex-grow min-h-[300px] max-h-[60vh] overflow-auto rounded-lg border bg-secondary/30 text-white">
                    <ScrollArea className="h-full">
                    {history.length === 0 ? (
                        <div className="flex h-full items-center justify-center text-white/50 p-4">
                            Your code execution history will appear here.
                        </div>
                    ) : (
                        <div className='p-4 space-y-2'>
                        {history.map((item, index) => (
                            <Card key={index} className='bg-black/20 border-white/10'>
                                <CardContent className='p-3 flex items-center justify-between'>
                                    <div className='w-full pr-2'>
                                      <div className="font-semibold text-sm capitalize">{item.name}</div>
                                      <div className="text-xs text-white/60">{languages.find(l => l.value === item.language)?.label}</div>
                                    </div>
                                    <Button size="icon" variant="ghost" onClick={() => handleRestoreHistory(item)}>
                                        <RotateCcw className='h-4 w-4' />
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                        </div>
                    )}
                    </ScrollArea>
                </div>
            </DialogContent>
          </Dialog>


          <Select value={language} onValueChange={handleLanguageChange}>
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
            {isLoading && !isAwaitingInput ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
            Compile & Run
          </Button>
        </div>
      </header>
      
      <main className="flex-1 grid grid-cols-1 p-4 md:p-6 gap-6">
        <div className="flex flex-col gap-2 min-h-[40vh]">
          <h2 className="text-lg font-semibold tracking-tight text-white">Code Editor</h2>
          <div className="flex-grow relative border border-white/10 rounded-lg overflow-hidden bg-black/30">
            <div ref={lineNumbersRef} className="absolute left-0 top-0 h-full overflow-hidden bg-black/20 text-right pr-2 pt-2 select-none text-white/50 font-code text-sm" style={{ width: '40px' }}>
              {Array.from({ length: lineCount }, (_, i) => i + 1).map(i => <div key={i}>{i}</div>)}
            </div>
            <Textarea
              ref={textareaRef}
              id="code-input"
              placeholder="# Start writing your code here..."
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onScroll={handleTextareaScroll}
              className="absolute inset-0 w-full h-full font-code text-sm resize-none bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-white"
              style={{ paddingLeft: '50px' }}
              spellCheck="false"
            />
          </div>
        </div>
        
        <div className="flex flex-col gap-2 min-h-[30vh]">
            <h2 className="text-lg font-semibold tracking-tight text-white">Output</h2>
            <div className="relative flex-grow flex flex-col min-h-[150px] rounded-lg border border-white/10 bg-black/30 text-white">
              <ScrollArea className="flex-grow p-4">
                <div id="code-output" ref={outputRef} className="font-code text-sm h-full">
                  {isLoading && !isAwaitingInput ? (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm">
                      <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
                      <p className="mt-2 text-sm text-white/70">Running code...</p>
                    </div>
                  ) : null}
                  <pre className="whitespace-pre-wrap break-words"><code className={output.includes('Error:') ? 'text-destructive' : ''}>{output}</code></pre>
                  {imageOutput && <Image src={imageOutput} alt="Generated plot" width={400} height={300} />}
                  
                  {!isLoading && !output && !imageOutput && !isAwaitingInput && (
                      <div className="flex h-full items-start justify-start text-white/50">
                      Output will be displayed here.
                      </div>
                  )}
                </div>
              </ScrollArea>
              {isAwaitingInput && (
                <div className="flex items-center gap-2 border-t border-white/10 p-2">
                  <Input
                    type="text"
                    value={interactiveInput}
                    onChange={(e) => setInteractiveInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleInteractiveInput()}
                    placeholder="Enter input..."
                    className="flex-grow bg-transparent border-0 focus-visible:ring-0 text-white"
                    disabled={isLoading}
                  />
                  <Button onClick={handleInteractiveInput} disabled={isLoading} size="sm">
                    {isLoading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Send
                  </Button>
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

    