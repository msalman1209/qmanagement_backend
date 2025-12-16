import mysql from "mysql2/promise"
import dotenv from "dotenv"

dotenv.config()

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  port: 3306,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: "+05:00", // Pakistan timezone (Local time where work happens)
  dateStrings: true, // Return DATE, DATETIME, and TIMESTAMP values as strings instead of converting to Date object
  supportBigNumbers: true,
  bigNumberStrings: true
})

export default pool
