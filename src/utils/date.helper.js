// Central helper: converts any ISO string or JS Date to Indian local date & time
exports.toIST = (value) => {
  const date = new Date(value);
  return date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }); // e.g. "16/12/2024, 08:03 PM"
};
