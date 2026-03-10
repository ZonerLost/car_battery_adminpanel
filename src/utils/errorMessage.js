const readArrayMessage = (value) => {
  if (!Array.isArray(value) || value.length === 0) return "";

  const first = value[0];
  if (typeof first === "string") return first.trim();
  if (typeof first?.message === "string") return first.message.trim();
  if (typeof first?.error === "string") return first.error.trim();
  return "";
};

export function getErrorMessage(error, fallback = "Something went wrong") {
  const message =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    readArrayMessage(error?.response?.data?.errors) ||
    error?.data?.message ||
    error?.data?.error ||
    readArrayMessage(error?.data?.errors) ||
    error?.message ||
    fallback;

  return typeof message === "string" && message.trim() ? message.trim() : fallback;
}
