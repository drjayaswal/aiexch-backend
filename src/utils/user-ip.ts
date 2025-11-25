export const getCurrentIP = (headers: any, request: any) => {
  const forwardedFor =
    headers["x-forwarded-for"] || request.headers.get("x-forwarded-for");
  const realIp = headers["x-real-ip"] || request.headers.get("x-real-ip");
  const cfIp = request.headers.get("cf-connecting-ip");

  let clientIP = "127.0.0.1";
  if (forwardedFor && typeof forwardedFor === "string") {
    clientIP = forwardedFor.split(",")[0].trim();
  } else if (realIp && typeof realIp === "string") {
    clientIP = realIp;
  } else if (cfIp && typeof cfIp === "string") {
    clientIP = cfIp;
  }

  return clientIP;
};
