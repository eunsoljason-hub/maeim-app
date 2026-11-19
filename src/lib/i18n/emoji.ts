import { MOODS } from "@/lib/constants";

export function moodEmojiOf(id: string | null | undefined): string {
  return MOODS.find((mood) => mood.id === id)?.emoji ?? "·";
}
