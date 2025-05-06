import { Client } from "@tmi.js/chat";
import { useEffect, useState } from "react";

import { Emotes } from "./helpers/emote";
import { MessagePart, parseMessage } from "./helpers/message";
import { hue } from "./helpers/user";

export interface MessageUser {
  id: string;
  name: string;
  badges: Map<string, string>;
  hue: number;
}

export interface Message {
  id: string;
  user: MessageUser;
  parts: MessagePart[];
}

export interface UseChatHistoryProps {
  // Channel ID
  channelId: string;

  // Channel login
  channelLogin: string;

  // Size of the message history
  size: number;
}

export function useChatHistory(props: UseChatHistoryProps) {
  const [messages, setMessages] = useState(new Array<Message>());

  useEffect(() => {
    const emotes = new Emotes(props.channelId);
    const chat = new Client({
      channels: [props.channelLogin],
    });

    chat.on("moderation", (event) => {
      switch (event.type) {
        case "ban":
        case "timeout":
          return setMessages((values) => values.filter((value) => value.user.id !== event.user.id));

        case "deleteMessage":
          return setMessages((values) => values.filter((value) => value.id !== event.message.id));

        case "clearChat":
          return setMessages([]);
      }
    });

    chat.on("message", (event) => {
      const { message, user } = event;

      const data = {
        id: message.id,

        user: {
          id: user.id,
          name: user.display || user.login,
          hue: user.color ? hue(user.color) : Number.parseInt(user.id) % 360,
          badges: user.badges,
        },

        parts: parseMessage(message.text, message.emotes, emotes),
      };

      setMessages((values) => values.concat(data).slice(-props.size));
    });

    chat.connect();

    return () => {
      emotes.dispose();
      chat.close();
    };
  }, [props]);

  return messages;
}
