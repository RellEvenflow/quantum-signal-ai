export default async function handler(req, res) {
  const { symbol, interval, type = "timeseries", outputsize = "120" } = req.query;

  const TWELVE_KEY = "9159b457e1f84232a39840dcbc9a6685";

  if (!symbol) {
    return res.status(400).json({ status: "error", error_message: "symbol is required" });
  }

  let apiUrl;
  if (type === "quote") {
    apiUrl = `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(symbol)}&apikey=${TWELVE_KEY}`;
  } else {
    apiUrl = `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(symbol)}&interval=${interval}&outputsize=${outputsize}&apikey=${TWELVE_KEY}`;
  }

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate");

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ status: "error", error_message: err.message });
  }
}
