"use client";

import { useState, useCallback, useMemo } from 'react';
import { runCode } from '@/ai/flows/run-code';
import { languages, type Language } from '@/lib/languages';
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Hammer, Download, Trash2, LoaderCircle, Play } from "lucide-react";

export function CodeEditor() {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState(languages[0].value);
  const [output, setOutput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const selectedLanguage = useMemo(() => languages.find(l => l.value === language) || languages[0], [language]);

  const handleRunCode = async () => {
    if (code.trim() === '') {
      setOutput('');
      return;
    }
    setIsLoading(true);
    try {
      const result = await runCode({ code, language });
      setOutput(result.output);
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
  };

  return (
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
            <Button onClick={handleRunCode} disabled={isLoading}>
              <Play className="mr-2 h-4 w-4" />
              Run Code
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="code-input" className="text-sm font-semibold">Your Code</Label>
          <Textarea
            id="code-input"
            placeholder={`// Start writing your ${selectedLanguage.label} code here...`}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="min-h-[250px] font-code text-sm resize-y"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="code-output" className="text-sm font-semibold">Output</Label>
          <div id="code-output" className="relative min-h-[250px] h-full w-full overflow-auto rounded-lg border bg-secondary/30 p-4 font-code text-sm">
            {isLoading && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
                <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
                <p className="mt-2 text-sm text-muted-foreground">Running code...</p>
              </div>
            )}
            {output ? (
              <pre className="whitespace-pre-wrap break-words"><code className={output.startsWith('Error:') ? 'text-destructive' : ''}>{output}</code></pre>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                Code output will appear here.
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
