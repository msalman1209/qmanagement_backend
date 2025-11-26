import jwt from "jsonwebtoken"

export const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-here"

export const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  })
}

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    throw new Error("Invalid or expired token")
  }
}
