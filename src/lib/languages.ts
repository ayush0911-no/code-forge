export type Language = {
  value: string;
  label: string;
  extension: string;
};

export const languages: Language[] = [
  { value: 'javascript', label: 'JavaScript', extension: 'js' },
  { value: 'python', label: 'Python', extension: 'py' },
  { value: 'html', label: 'HTML', extension: 'html' },
  { value: 'css',label: 'CSS', extension: 'css' },
  { value: 'typescript', label: 'TypeScript', extension: 'ts' },
  { value: 'java', label: 'Java', extension: 'java' },
  { value: 'go', label: 'Go', extension: 'go' },
  { value: 'rust', label: 'Rust', extension: 'rs' },
  { value: 'csharp', label: 'C#', extension: 'cs'},
];
