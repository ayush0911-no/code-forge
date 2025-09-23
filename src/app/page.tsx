import { CodeEditor } from '@/components/code-editor';

export default function Home() {
  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <CodeEditor />
    </div>
  );
}
