import bcrypt from "bcryptjs";

export const generateHashPassword = async (
  password: string,
  round: number = 10
) => {
  const pass = await bcrypt.hash(password, round);
  return pass;
};

export const comparePassword = async (
  password: string,
  hashPassword: string
) => {
  const pass = await bcrypt.compare(password, hashPassword);
  return pass;
};
