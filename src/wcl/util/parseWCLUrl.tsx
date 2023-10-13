export const parseWCLUrl = (maybeURL: string) => {
  if (isValidReportId(maybeURL)) {
    return maybeURL;
  }

  try {
    const { pathname, host, hash } = new URL(maybeURL);

    // not a WCL url
    if (
      !host.includes("warcraftlogs.com") ||
      !pathname.startsWith("/reports/")
    ) {
      return;
    }

    const maybeReportID = pathname.replace("/reports/", "").replace("/", "");

    // WCL url, but doesnt point to reports
    if (!isValidReportId(maybeReportID)) {
      return;
    }

    // WCL url, points to reports, but no fight selected
    if (!hash) {
      return maybeReportID;
    }

    const maybeFightID = new URLSearchParams(hash.slice(1)).get("fight");

    // no fightID at all
    if (!maybeFightID) {
      return maybeReportID;
    }

    // fightID may be `last` or numeric
    if (maybeFightID === "last" || Number.parseInt(maybeFightID) > 0) {
      return maybeReportID;
    }

    return maybeReportID;
  } catch {
    return;
  }
};

const isValidReportId = (id?: string | string[]): id is string => {
  if (!id || Array.isArray(id) || id.includes(".")) {
    return false;
  }

  return (id.startsWith("a:") && id.length === 18) || id.length === 16;
};
