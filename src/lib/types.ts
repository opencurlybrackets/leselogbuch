export interface Book {
  id: string;
  title: string;
  author: string;
  genre: string;
  summary: string;
  coverImageUrl: string;
  review?: string;
  dateAdded: string;
  rating?: number;
}

export interface BookRecommendation {
  title: string;
  author: string;
  genre: string | string[];
  reason: string;
}
