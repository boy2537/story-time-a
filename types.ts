export interface StoryPage {
  text: string;
  imageUrl?: string;
  audioBuffer?: AudioBuffer;
  isLoadingImage: boolean;
  isLoadingAudio: boolean;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
