export interface Photo {
  id: string;
  path: string;
  width: number;
  height: number;
}
export interface Message {
  id: string;
  text: string;
  photos: Photo[];
  tags?: string[];
  quoted_message: Message | null;
  created_at: string;
  date: string;
}
