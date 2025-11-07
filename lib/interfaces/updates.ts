export interface Update {
  id: string;
  title: string;
  description?: string;
  step: string;
  progress?: number; // 0 to 100
  getBadgeVariant: 'destructive' | 'outline' | 'secondary' | 'default';
}