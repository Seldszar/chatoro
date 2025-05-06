export function hue(input: string) {
  const red = Number.parseInt(input.slice(1, 3), 16) / 255;
  const green = Number.parseInt(input.slice(3, 5), 16) / 255;
  const blue = Number.parseInt(input.slice(5, 7), 16) / 255;

  const min = Math.min(red, green, blue);
  const max = Math.max(red, green, blue);

  switch (max) {
    case red:
      return Math.round(((green - blue) / (max - min)) * 60) % 360;

    case green:
      return Math.round((2 + (blue - red) / (max - min)) * 60) % 360;

    case blue:
      return Math.round((4 + (red - green) / (max - min)) * 60) % 360;
  }

  return 0;
}
