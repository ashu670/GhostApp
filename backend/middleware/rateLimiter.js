const rateLimit = require("express-rate-limit");

const actionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 requests per `window`
  handler: (req, res) => {
    // Math.ceil ensuring seconds doesn't resolve to a floating point
    const remainingSeconds = Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000);
    
    console.log(`🚫 Action Rate limit hit: ${req.ip} → ${req.originalUrl}`);

    res.status(429).json({
      success: false,
      message: "Too many actions. Please slow down.",
      retryAfter: Math.max(1, remainingSeconds),
    });
  },
});

module.exports = { actionLimiter };
