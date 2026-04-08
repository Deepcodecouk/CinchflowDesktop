export function toDisplayVersion(version: string): string {
  const match = /^(\d+)\.(\d+)(?:\.(\d+))?$/.exec(version);

  if (!match) {
    return version;
  }

  return `${match[1]}.${match[2]}`;
}
