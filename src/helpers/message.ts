import { Emote, Emotes } from "./emote";

export interface EmoteOffset {
  indices: number[][];
  id: string;
}

export interface EmoteOccurence {
  emote: Emote;

  start: number;
  end: number;
}

export interface Message {
  emoteOffsets: EmoteOffset[];
  emotes: Emotes;
  text: string;
}

export interface MessagePart {
  content: string;
  emote?: Emote;
}

function getEmojiCode(emoji: string) {
  return Array.from(emoji, (value) => value.codePointAt(0)!.toString(16)).join("-");
}

export function parseMessage(text: string, offsets: EmoteOffset[], emotes: Emotes) {
  const occurrences = new Array<EmoteOccurence>();
  const parts = new Array<MessagePart>();

  let lastPosition = 0;

  offsets.forEach((offset) => {
    offset.indices.forEach((indice) => {
      const [start, end] = indice;

      occurrences.push({
        emote: {
          url: `https://static-cdn.jtvnw.net/emoticons/v2/${offset.id}/default/dark/1.0`,
          code: text.substring(start, end),
        },

        start,
        end,
      });
    });
  });

  emotes.forEach((emote, name) => {
    const matches = text.matchAll(new RegExp(`\b${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\b`, "g"));

    for (const match of matches) {
      occurrences.push({
        emote,

        start: match.index,
        end: match.index + name.length,
      });
    }
  });

  const matches = text.matchAll(
    /[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F1E0}-\u{1F1FF}]/gu
  );

  for (const match of matches) {
    const emoji = match[0];

    occurrences.push({
      emote: {
        url: `https://cdn.jsdelivr.net/gh/jdecked/twemoji/assets/svg/${getEmojiCode(emoji)}.svg`,
        code: emoji,
      },

      start: match.index,
      end: match.index + emoji.length,
    });
  }

  occurrences.sort((a, b) => a.start - b.start);

  for (const occurence of occurrences) {
    if (occurence.start > lastPosition) {
      parts.push({
        content: text.substring(lastPosition, occurence.start),
      });
    }

    lastPosition = occurence.end + 1;

    parts.push({
      content: text.substring(occurence.start, lastPosition),
      emote: occurence.emote,
    });
  }

  if (lastPosition < text.length) {
    parts.push({
      content: text.substring(lastPosition),
    });
  }

  return parts;
}
