export type Language = {
  value: string;
  label: string;
  extension: string;
};

export const languages: Language[] = [
  { value: 'javascript', label: 'JavaScript', extension: 'js' },
  { value: 'python', label: 'Python', extension: 'py' },
  { value: 'java', label: 'Java', extension: 'java' },
];
