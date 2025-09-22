import { CodeEditor } from '@/components/code-editor';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 py-8 md:p-8 lg:p-12 bg-background">
      <CodeEditor />
    </main>
  );
}
