export const getAvartarFromName = (name: string): string => {
  const hash = Array.from(name).reduce(
    (acc, char) => acc + char.charCodeAt(0),
    0
  );
  const colors = [
    "3b82f6", // Blue
    "10b981", // Emerald
    "f59e0b", // Amber
    "ef4444", // Red
    "8b5cf6", // Violet
    "06b6d4", // Cyan
    "84cc16", // Lime
    "f97316", // Orange
    "ec4899", // Pink
    "6366f1", // Indigo
    "14b8a6", // Teal
    "a855f7", // Purple
  ];
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name
  )}&background=${colors[hash % colors.length]}&color=fff`;
};
