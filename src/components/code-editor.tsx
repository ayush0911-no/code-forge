"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { codeAutoCompletion } from '@/ai/flows/code-auto-completion';
import { detectAndHighlightErrors } from '@/ai/flows/error-detection-and-highlighting';
import { languages, type Language } from '@/lib/languages';
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Hammer, Download, Trash2, LoaderCircle, AlertCircle } from "lucide-react";

export function CodeEditor() {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState(languages[0].value);
  const [highlightedCode, setHighlightedCode] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const selectedLanguage = useMemo(() => languages.find(l => l.value === language) || languages[0], [language]);

  useEffect(() => {
    const processCode = async () => {
      if (code.trim() === '') {
        setHighlightedCode('');
        setErrors([]);
        setSuggestions([]);
        return;
      }
      setIsLoading(true);
      try {
        const [errorResult, completionResult] = await Promise.allSettled([
          detectAndHighlightErrors({ code, language }),
          codeAutoCompletion({ codeSnippet: code, language }),
        ]);

        if (errorResult.status === 'fulfilled' && errorResult.value) {
          setHighlightedCode(errorResult.value.highlightedCode);
          setErrors(errorResult.value.errors);
        } else {
          setHighlightedCode(`<span class="text-destructive">${(errorResult as PromiseRejectedResult).reason?.message || 'Error highlighting code.'}</span>`);
          setErrors([]);
        }

        if (completionResult.status === 'fulfilled' && completionResult.value) {
          setSuggestions(completionResult.value.completionSuggestions);
        } else {
          setSuggestions([]);
        }

      } catch (error) {
        console.error("AI processing failed:", error);
        toast({
          variant: "destructive",
          title: "AI Error",
          description: "Could not process code. Please try again later.",
        });
        setHighlightedCode(`<span class="text-destructive">An unexpected error occurred.</span>`);
      } finally {
        setIsLoading(false);
      }
    };

    const handler = setTimeout(() => {
      processCode();
    }, 1000);

    return () => {
      clearTimeout(handler);
    };
  }, [code, language, toast]);

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
    setHighlightedCode('');
    setErrors([]);
    setSuggestions([]);
  };

  const insertSuggestion = (suggestion: string) => {
    // A more robust implementation would handle cursor position
    setCode(prev => prev + suggestion);
  };

  return (
    <Card className="w-full max-w-7xl shadow-2xl">
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
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="code-input" className="text-sm font-semibold">Your Code</Label>
            <Textarea
              id="code-input"
              placeholder={`// Start writing your ${selectedLanguage.label} code here...`}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="h-[500px] font-code text-sm resize-none"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="code-output" className="text-sm font-semibold">AI Analysis</Label>
            <div id="code-output" className="relative h-[500px] w-full overflow-auto rounded-lg border bg-secondary/30 p-4 font-code text-sm">
              {isLoading && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
                  <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
                  <p className="mt-2 text-sm text-muted-foreground">Analyzing code...</p>
                </div>
              )}
              {highlightedCode ? (
                <pre><code dangerouslySetInnerHTML={{ __html: highlightedCode }} /></pre>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  Code analysis will appear here.
                </div>
              )}
            </div>
          </div>
        </div>
        
        <Accordion type="multiple" className="w-full" defaultValue={['errors', 'suggestions']}>
          <AccordionItem value="errors">
            <AccordionTrigger className="text-base font-semibold">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                Detected Errors
                {errors.length > 0 && <span className="flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs font-bold">{errors.length}</span>}
              </div>
            </AccordionTrigger>
            <AccordionContent>
              {errors.length > 0 ? (
                <div className="space-y-2 pr-2">
                  {errors.map((error, index) => (
                    <Alert key={index} variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No errors detected.</p>
              )}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="suggestions">
            <AccordionTrigger className="text-base font-semibold">
              <div className="flex items-center gap-2">
                Auto-Completion Suggestions
              </div>
            </AccordionTrigger>
            <AccordionContent>
              {suggestions.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((suggestion, index) => (
                    <Button key={index} variant="outline" size="sm" onClick={() => insertSuggestion(suggestion)} className="bg-accent/50 hover:bg-accent text-accent-foreground">
                      {suggestion}
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No suggestions available. Keep typing for suggestions.</p>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
