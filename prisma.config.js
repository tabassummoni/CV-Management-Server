import 'dotenv/config'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  earlyAccess: true, // প্রিজমা ৭-এ নতুন কনফিগারেশন ড্রাইভের জন্য এটি লাগতে পারে
  datasource: {
    url: process.env.DATABASE_URL,
  },
})