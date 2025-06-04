import { Client } from "@tmi.js/chat";
import { useEffect, useRef, useState } from "react";

import { Emotes } from "./helpers/emote";
import { MessagePart, parseMessage } from "./helpers/message";
import { DelayQueue } from "./helpers/queue";
import { hue } from "./helpers/user";

export interface MessageUser {
  id: string;
  login: string;
  displayName: string;
  badges: Map<string, string>;
  hue: number;
}

export interface Message {
  id: string;
  date: number;
  user: MessageUser;
  parts: MessagePart[];
}

export interface UseChatHistoryProps {
  // Channel ID
  channelId: string;

  // Channel login
  channelLogin: string;

  // Artificial delay messages are added
  delay: number;

  // Ignored user IDs
  ignoredUsers: string[];

  // Size of the message history
  size: number;
}

export function useChatHistory(props: UseChatHistoryProps) {
  const [messages, setMessages] = useState(new Array<Message>());

  const delayRef = useRef(props.delay);
  const ignoredUsersRef = useRef(props.ignoredUsers);
  const sizeRef = useRef(props.size);

  delayRef.current = props.delay;
  ignoredUsersRef.current = props.ignoredUsers;
  sizeRef.current = props.size;

  useEffect(() => {
    const emotes = new Emotes(props.channelId);

    const chat = new Client({
      channels: [props.channelLogin],
    });

    const queue = new DelayQueue<Message>((message) => {
      setMessages((messages) => messages.concat(message).slice(-sizeRef.current));
    });

    chat.on("moderation", (event) => {
      switch (event.type) {
        case "ban":
        case "timeout": {
          queue.filter((message) => message.user.id !== event.user.id);

          setMessages((messages) =>
            messages.filter((message) => message.user.id !== event.user.id),
          );

          return;
        }

        case "deleteMessage": {
          queue.filter((message) => message.id !== event.message.id);

          setMessages((messages) =>
            messages.filter((message) => message.id !== event.message.id),
        );

          return;
        }

        case "clearChat":
          return setMessages([]);
      }
    });

    chat.on("message", (event) => {
      const { message, user, tags } = event;

      if (ignoredUsersRef.current.includes(user.id)) {
        return;
      }

      const line = {
        id: message.id,
        date: tags.tmiSentTs,

        user: {
          id: user.id,
          login: user.login,
          displayName: user.display,
          hue: user.color ? hue(user.color) : Number.parseInt(user.id) % 360,
          badges: user.badges,
        },

        parts: parseMessage(message.text, message.emotes, emotes),
      };

      queue.add(line, delayRef.current);
    });

    chat.connect();

    return () => {
      emotes.dispose();
      chat.close();
    };
  }, [props.channelId, props.channelLogin]);

  return messages;
}
