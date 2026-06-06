import type { Book } from "@/lib/types";
import type { SupabaseClient } from "@supabase/supabase-js";

type BookRow = {
  id: string;
  user_id: string;
  title: string;
  author: string;
  genre: string;
  summary: string;
  cover_image_url: string;
  review: string | null;
  rating: number | null;
  date_added: string;
};

function rowToBook(row: BookRow): Book {
  return {
    id: row.id,
    title: row.title,
    author: row.author,
    genre: row.genre,
    summary: row.summary,
    coverImageUrl: row.cover_image_url,
    review: row.review ?? undefined,
    rating: row.rating ?? undefined,
    dateAdded: row.date_added
  };
}

export async function fetchBooks(supabase: SupabaseClient): Promise<Book[]> {
  const { data, error } = await supabase
    .from("books")
    .select("*")
    .order("date_added", { ascending: false });

  if (error) throw new Error(error.message);
  return (data as BookRow[]).map(rowToBook);
}

export async function insertBook(supabase: SupabaseClient, book: Book, userId: string): Promise<Book> {
  const { data, error } = await supabase
    .from("books")
    .insert({
      id: book.id,
      user_id: userId,
      title: book.title,
      author: book.author,
      genre: book.genre,
      summary: book.summary,
      cover_image_url: book.coverImageUrl,
      review: book.review ?? null,
      rating: book.rating ?? null,
      date_added: book.dateAdded
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return rowToBook(data as BookRow);
}

export async function updateBook(
  supabase: SupabaseClient,
  id: string,
  updates: Partial<Book>
): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (updates.title !== undefined) payload.title = updates.title;
  if (updates.author !== undefined) payload.author = updates.author;
  if (updates.genre !== undefined) payload.genre = updates.genre;
  if (updates.summary !== undefined) payload.summary = updates.summary;
  if (updates.coverImageUrl !== undefined) payload.cover_image_url = updates.coverImageUrl;
  if (updates.review !== undefined) payload.review = updates.review;
  if (updates.rating !== undefined) payload.rating = updates.rating;

  const { error } = await supabase.from("books").update(payload).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteBook(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("books").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
