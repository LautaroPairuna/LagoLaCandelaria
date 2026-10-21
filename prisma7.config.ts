import "dotenv/config"
import { defineConfig } from "prisma/config"

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "node --conditions=react-server --import tsx prisma/seed.mts",
  },
  datasource: {
    url:
      process.env.DATABASE_URL ??
      "mysql://USER:PASSWORD@127.0.0.1:3306/lago_la_candelaria",
  },
})
