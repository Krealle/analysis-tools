export function parseWCLUrl(input: string) {
  if (input.trim() === "") {
    return;
  }

  const url = new URL(input);

  const reportCode = url.pathname.split("/").pop() ?? "";

  return reportCode;
}
