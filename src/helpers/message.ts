import { Emote, Emotes } from "./emote";

export interface EmoteOffset {
  indices: number[][];
  id: string;
}

export interface EmoteOccurence {
  emoji?: Emote;
  url?: string;
  emote?: Emote;

  start: number;
  end: number;
}

export interface MessagePart {
  content: string;

  emoji?: Emote;
  url?: string;
  emote?: Emote;
}

function getEmojiCode(emoji: string) {
  return Array.from(emoji, (value) => value.codePointAt(0)?.toString(16)).join("-");
}

export function parseMessage(text: string, emoteOffsets: EmoteOffset[], emotes: Emotes) {
  const occurrences = new Array<EmoteOccurence>();
  const parts = new Array<MessagePart>();

  let lastPosition = 0;

  emoteOffsets.forEach((offset) => {
    offset.indices.forEach((indice) => {
      const start = indice[0];
      const end = indice[1];

      const emote = {
        url: `https://static-cdn.jtvnw.net/emoticons/v2/${offset.id}/default/dark/1.0`,
        code: text.substring(start, end),
      };

      occurrences.push({ emote, start, end });
    });
  });

  emotes.forEach((emote, name) => {
    const matches = text.matchAll(
      new RegExp(`(?<!\\S)${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?!\\S)`, "g"),
    );

    for (const match of matches) {
      const start = match.index;
      const end = start + name.length;

      occurrences.push({ emote, start, end });
    }
  });

  {
    const matches = text.matchAll(/\b(?:https?:\/\/)?\S+\.[a-z]+\b/gi);

    for (const match of matches) {
      const [url] = match;

      const start = match.index;
      const end = start + url.length;

      occurrences.push({ url, start, end });
    }
  }

  {
    const matches = text.matchAll(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}\u{1F1E0}-\u{1F1FF}]/gu);

    for (const match of matches) {
      const [code] = match;

      const start = match.index;
      const end = start + code.length;

      const emoji = {
        url: `https://cdn.jsdelivr.net/gh/jdecked/twemoji/assets/svg/${getEmojiCode(code)}.svg`,
        code,
      };

      occurrences.push({ emoji, start, end });
    }
  }

  occurrences.sort((a, b) => a.start - b.start);

  for (const occurence of occurrences) {
    if (occurence.start > lastPosition) {
      parts.push({ content: text.substring(lastPosition, occurence.start) });
    }

    parts.push({ ...occurence, content: text.substring(occurence.start, (lastPosition = occurence.end)) });
  }

  if (lastPosition < text.length) {
    parts.push({ content: text.substring(lastPosition) });
  }

  return parts;
}
