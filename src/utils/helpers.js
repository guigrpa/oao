// @flow

const shortenName = (name: string, maxLen: number): string => {
  if (name.length <= maxLen) return name;
  return `${name.slice(0, 2)}…${name.slice(-(maxLen - 3))}`;
};

export { shortenName };
