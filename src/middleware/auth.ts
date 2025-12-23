import jwt from "jsonwebtoken";
import { Cookie } from "elysia";
import { RoleType } from "../types";

interface ElysiaMiddlewareType {
  cookie: Record<string, Cookie<string | undefined | unknown>>;
  allowed?: string[];
}

const secretKey = process.env.JWT_SECRET!;

export const authenticate_jwt = (access_token: string) => {
  try {
    console.log(
      `TOKEN VALIDATION: Validating access token (length: ${access_token.length})`
    );
    const decoded = jwt.verify(access_token, secretKey);
    console.log(
      `TOKEN VALIDATION SUCCESS: Token valid for user ID: ${
        (decoded as any).id
      }, role: ${(decoded as any).role}`
    );
    return {
      success: true,
      code: 200,
      message: "Valid Access Token",
      data: decoded as { id: number; role: RoleType },
    };
  } catch (err) {
    console.log(`TOKEN VALIDATION FAILED: Invalid token - ${err}`);
    return {
      success: false,
      code: 401,
      message: "Invalid Access Token",
    };
  }
};

export const app_middleware = ({ cookie, allowed }: ElysiaMiddlewareType) => {
  let access_token = String(cookie.accessToken);
  console.log(`MIDDLEWARE: Checking authentication for request`);
  console.log(
    `MIDDLEWARE: Token present in cookies: ${
      !!access_token && access_token.length > 0
    }`
  );

  if (!access_token) {
    console.log(`MIDDLEWARE: No access token found in cookies`);
    return {
      success: false,
      code: 404,
      message: "No Access Token in Cookies",
    };
  }

  const middleware_response = authenticate_jwt(access_token);

  if (
    !middleware_response.success ||
    (!middleware_response.data?.id && !middleware_response.data?.role)
  ) {
    console.log(
      `MIDDLEWARE: Authentication failed - ${middleware_response.message}`
    );
    return {
      success: middleware_response.success,
      code: middleware_response.code,
      message: middleware_response.message,
    };
  }

  const userRole = middleware_response.data.role;
  const userId = middleware_response.data.id;
  const isAdmin = userRole === "admin";

  console.log(
    `MIDDLEWARE: User authenticated - ID: ${userId}, Role: ${userRole}, IsAdmin: ${isAdmin}`
  );

  if (allowed && !allowed.includes(userRole)) {
    console.log(
      `MIDDLEWARE: Access denied - User role ${userRole} not in allowed roles [${allowed.join(
        ", "
      )}]`
    );
    console.log(
      `MIDDLEWARE: Admin page access blocked for user ${userId} (role: ${userRole})`
    );
    return {
      success: false,
      code: 403,
      message: "Restricted Endpoint",
    };
  }

  if (allowed && allowed.includes("admin")) {
    console.log(
      `MIDDLEWARE: Admin page access granted for admin user ${userId}`
    );
  }

  console.log(`MIDDLEWARE: Authentication successful for user ${userId}`);
  return {
    success: middleware_response.success,
    code: middleware_response.code,
    message: middleware_response.message,
    data: middleware_response.data,
  };
};
