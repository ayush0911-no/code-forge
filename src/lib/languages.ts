export type Language = {
  value: string;
  label: string;
  extension: string;
};

export const languages: Language[] = [
  { value: 'python', label: 'Python', extension: 'py' },
  { value: 'java', label: 'Java', extension: 'java' },
  { value: 'c', label: 'C', extension: 'c' },
];
