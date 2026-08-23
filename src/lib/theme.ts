export const getDepartmentColor = (dept: string) => {
  switch (dept) {
    case "LSPD": return "#3b82f6";
    case "BCSO": return "#f59e0b";
    case "SASP": return "#0ea5e9";
    case "SAMS": return "#ef4444";
    case "DOJ": return "#a855f7";
    case "SAPR": return "#10b981";
    case "SASP Academy": return "#94a3b8";
    default: return "#0ea5e9"; // Default SASP Blue
  }
};

export const hexToRgba = (hex: string, alpha: number) => {
  if (!hex || hex.length !== 7) return `rgba(255, 255, 255, ${alpha})`;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
