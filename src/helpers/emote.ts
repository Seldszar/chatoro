export interface Emote {
  code: string;
  url: string;
}

interface EmoteSource {
  callback(data: any): void;
  url: string;
}

export class Emotes extends Map<string, Emote> {
  private timeoutId?: number;

  constructor(private channelId: string) {
    super();

    this.refresh();
  }

  private async refresh() {
    const sources = new Array<EmoteSource>(
      {
        url: "https://api.betterttv.net/3/cached/emotes/global",
        callback: (data) => {
          for (const emote of data) {
            this.set(emote.code, {
              url: `https://cdn.betterttv.net/emote/${emote.id}/1x`,
              code: emote.code,
            });
          }
        },
      },
      {
        url: `https://api.betterttv.net/3/cached/users/twitch/${this.channelId}`,
        callback: (data) => {
          for (const emote of data.channelEmotes) {
            this.set(emote.code, {
              url: `https://cdn.betterttv.net/emote/${emote.id}/1x`,
              code: emote.code,
            });
          }

          for (const emote of data.sharedEmotes) {
            this.set(emote.code, {
              url: `https://cdn.betterttv.net/emote/${emote.id}/1x`,
              code: emote.code,
            });
          }
        },
      },
      {
        url: "https://api.frankerfacez.com/v1/set/global",
        callback: (data) => {
          const sets = Object.values<any>(data.sets);

          for (const set of sets) {
            for (const emote of set.emoticons) {
              this.set(emote.name, {
                url: `https://cdn.frankerfacez.com/emote/${emote.id}/1`,
                code: emote.name,
              });
            }
          }
        },
      },
      {
        url: `https://api.frankerfacez.com/v1/room/id/${this.channelId}`,
        callback: (data) => {
          const sets = Object.values<any>(data.sets);

          for (const set of sets) {
            for (const emote of set.emoticons) {
              this.set(emote.name, {
                url: `https://cdn.frankerfacez.com/emote/${emote.id}/1`,
                code: emote.name,
              });
            }
          }
        },
      },
      {
        url: "https://7tv.io/v3/emote-sets/global",
        callback: (data) => {
          for (const emote of data.emotes) {
            this.set(emote.name, {
              url: `https://cdn.7tv.app/emote/${emote.id}/1x.webp`,
              code: emote.name,
            });
          }
        },
      },
      {
        url: `https://7tv.io/v3/users/twitch/${this.channelId}`,
        callback: (data) => {
          for (const emote of data.emote_set.emotes) {
            this.set(emote.name, {
              url: `https://cdn.7tv.app/emote/${emote.id}/1x.webp`,
              code: emote.name,
            });
          }
        },
      },
    );

    if (this.timeoutId) {
      window.clearTimeout(this.timeoutId);
    }

    await Promise.allSettled(
      sources.map(async (source) => {
        const response = await fetch(source.url);

        if (response.ok) {
          return source.callback(await response.json());
        }
      }),
    );

    this.timeoutId = window.setTimeout(() => this.refresh(), 600_000);
  }

  dispose() {
    clearTimeout(this.timeoutId);
  }
}
