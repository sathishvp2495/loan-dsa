export function formatCurrency(value: number | string | null | undefined) {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

export function prettyStage(stage: string) {
  return stage.replaceAll("_", " ");
}
