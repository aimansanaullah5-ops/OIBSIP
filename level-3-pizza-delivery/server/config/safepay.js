const Safepay = require("@sfpy/node-core");

if (!process.env.SAFEPAY_SECRET_KEY) {
  throw new Error("SAFEPAY_SECRET_KEY is missing from .env");
}

const safepay = Safepay(process.env.SAFEPAY_SECRET_KEY, {
  authType: "secret",
  host:
    process.env.SAFEPAY_ENV === "production"
      ? "https://api.getsafepay.com"
      : "https://sandbox.api.getsafepay.com",
});

module.exports = safepay;