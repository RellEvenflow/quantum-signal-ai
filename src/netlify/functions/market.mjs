export default async (request, context) => {
  const url = new URL(request.url);
  const symbol = url.searchParams.get("symbol");
  const interval = url.searchParams.get("interval");
  const type = url.searchParams.get("type") || "timeseries";
  const outputsize = url.searchParams.get("outputsize") || "120";

  const TWELVE_KEY = "9159b457e1f84232a39840dcbc9a6685";

  let apiUrl;
  if (type === "quote") {
    apiUrl = `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(symbol)}&apikey=${TWELVE_KEY}`;
  } else {
    apiUrl = `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(symbol)}&interval=${interval}&outputsize=${outputsize}&apikey=${TWELVE_KEY}`;
  }

  try {
    const res = await fetch(apiUrl);
    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ status: "error", error_message: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
};

export const config = { path: "/api/market" };
