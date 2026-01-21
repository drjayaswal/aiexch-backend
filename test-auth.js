// Test script to verify JWT token generation and validation
import dotenv from "dotenv";
dotenv.config();

import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";

function generateAccessToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

function generateRefreshToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
}

function generateTokens(id, email, role) {
  const payload = { id, email, role };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);
  return { accessToken, refreshToken };
}

console.log("=== JWT Auth Test ===");
console.log("JWT_SECRET exists:", !!JWT_SECRET);
console.log("JWT_SECRET length:", JWT_SECRET?.length);

// Test token generation for admin user
const adminPayload = { id: 1, email: "erfan@gmail.com", role: "admin" };
console.log("\n=== Testing Admin Token Generation ===");
console.log("Payload:", adminPayload);

try {
  const { accessToken, refreshToken } = generateTokens(
    adminPayload.id,
    adminPayload.email,
    adminPayload.role
  );

  // Test the authenticate_jwt function logic
  const authenticate_jwt = (access_token) => {
    try {
      const decoded = jwt.verify(access_token, JWT_SECRET);
      return {
        success: true,
        code: 200,
        message: "Valid Access Token",
        data: decoded,
      };
    } catch (err) {
      return {
        success: false,
        code: 401,
        message: "Invalid Access Token",
      };
    }
  };

  const authResult = authenticate_jwt(accessToken);

  // Test role check
  const allowed = ["admin"];
  const roleCheck = allowed.includes(authResult.data?.role);
} catch (error) {
  console.error("Error during token test:", error);
}
