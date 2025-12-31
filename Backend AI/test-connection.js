const https = require("https");
const dns = require("dns");

console.log("Testing network connectivity...\n");

// Test 1: DNS Resolution
console.log("1. Testing DNS resolution...");
dns.resolve4(
  "ep-shrill-water-a1r5okv0.ap-southeast-1.aws.neon.tech",
  (err, addresses) => {
    if (err) {
      console.log("❌ DNS Resolution Failed:", err.message);
      console.log("\nThis means your network cannot find the database host.");
      console.log("Possible solutions:");
      console.log("  1. Check your internet connection");
      console.log("  2. Try using a VPN");
      console.log("  3. Check if your firewall is blocking the connection");
      console.log("  4. Use a local database instead\n");
    } else {
      console.log("✅ DNS Resolution Successful:", addresses);

      // Test 2: HTTPS Connection
      console.log("\n2. Testing HTTPS connection...");
      https
        .get("https://www.google.com", (res) => {
          console.log("✅ Internet connection is working");
          console.log("   Status Code:", res.statusCode);

          console.log(
            "\n⚠️ The database host DNS resolves but PostgreSQL might not be accessible."
          );
          console.log("   This could be due to:");
          console.log("   - Firewall blocking port 5432");
          console.log("   - Database host is down");
          console.log("   - Network restrictions\n");
        })
        .on("error", (err) => {
          console.log("❌ Internet connection failed:", err.message);
        });
    }
  }
);

// Test 3: Try alternate DNS
console.log("\n3. Checking system DNS settings...");
dns.getServers().forEach((server, i) => {
  console.log(`   DNS Server ${i + 1}: ${server}`);
});

console.log("\n4. Attempting to reach Neon.tech...");
https
  .get("https://neon.tech", (res) => {
    console.log(
      "✅ Can reach neon.tech website (Status:",
      res.statusCode + ")"
    );
    console.log(
      "   But the specific database endpoint might still be unreachable."
    );
  })
  .on("error", (err) => {
    console.log("❌ Cannot reach neon.tech:", err.message);
  });

setTimeout(() => {
  console.log("\n" + "=".repeat(60));
  console.log("RECOMMENDATION:");
  console.log("=".repeat(60));
  console.log("Since the cloud database is not accessible from your network,");
  console.log("I recommend using a local database for development.");
  console.log("\nOptions:");
  console.log(
    "  A) Install PostgreSQL locally (best for production-like setup)"
  );
  console.log("  B) Use SQLite (already installed, no setup needed)");
  console.log("\nI can help you set up either option!");
  console.log("=".repeat(60));
}, 2000);
