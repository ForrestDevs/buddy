

export function getPurchasedStates(key: string): Record<string, boolean> {
  console.log(key);
  const stored = localStorage.getItem(key);
  console.log(stored);
  return stored ? JSON.parse(stored) : {};
}

export function getCurrentMarketcap(): number {
  const stored = localStorage.getItem("marketcap");
  return stored ? JSON.parse(stored) : 0;
}

