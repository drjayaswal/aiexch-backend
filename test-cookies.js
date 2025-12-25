// Test script to verify cookie configuration
require("dotenv").config();

const isProduction = process.env.NODE_ENV === "production";

console.log("=== Cookie Configuration Test ===");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("Is Production:", isProduction);

const cookieConfig = {
  accessToken: {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "lax" : "lax",
    domain: isProduction ? ".aiexch.com" : undefined,
    maxAge: 60 * 15,
  },
  refreshToken: {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "lax" : "lax",
    domain: isProduction ? ".aiexch.com" : undefined,
    maxAge: 60 * 60 * 24 * 7,
  },
};

console.log("\n=== Production Cookie Config ===");
console.log("Access Token:", cookieConfig.accessToken);
console.log("Refresh Token:", cookieConfig.refreshToken);

console.log("\n=== Cookie Domain Analysis ===");
console.log("Frontend URL (production): https://www.aiexch.com");
console.log("Backend URL (production): https://api.aiexch.com");
console.log("Cookie domain:", cookieConfig.accessToken.domain);
console.log("SameSite:", cookieConfig.accessToken.sameSite);
console.log("Secure:", cookieConfig.accessToken.secure);

// Test cross-domain scenarios
console.log("\n=== Cross-Domain Cookie Tests ===");
const scenarios = [
  {
    name: "www.aiexch.com -> api.aiexch.com",
    frontend: "www.aiexch.com",
    backend: "api.aiexch.com",
    cookieDomain: ".aiexch.com",
    shouldWork: true,
  },
  {
    name: "aiexch.com -> api.aiexch.com",
    frontend: "aiexch.com",
    backend: "api.aiexch.com",
    cookieDomain: ".aiexch.com",
    shouldWork: true,
  },
  {
    name: "localhost:3000 -> localhost:3001",
    frontend: "localhost:3000",
    backend: "localhost:3001",
    cookieDomain: undefined,
    shouldWork: true,
  },
];

scenarios.forEach((scenario) => {
  console.log(`\n${scenario.name}:`);
  console.log(`  Frontend: ${scenario.frontend}`);
  console.log(`  Backend: ${scenario.backend}`);
  console.log(`  Cookie Domain: ${scenario.cookieDomain}`);
  console.log(`  Expected to work: ${scenario.shouldWork ? "YES" : "NO"}`);

  // Check if cookie domain matches
  if (scenario.cookieDomain) {
    const frontendMatches = scenario.frontend.endsWith(
      scenario.cookieDomain.replace(".", "")
    );
    const backendMatches = scenario.backend.endsWith(
      scenario.cookieDomain.replace(".", "")
    );
    console.log(`  Frontend matches domain: ${frontendMatches}`);
    console.log(`  Backend matches domain: ${backendMatches}`);
  }
});
