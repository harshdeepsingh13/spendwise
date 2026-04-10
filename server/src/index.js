import { env } from './config/env.js'
import { connectDB } from './config/db.js'
import { seedDefaultCategories } from './config/seed.js'
import { createApp } from './app.js'

const start = async () => {
  try {
    await connectDB()
    await seedDefaultCategories()
    const app = createApp()
    app.listen(env.PORT, () => {
      console.log(`Server running on port ${env.PORT}`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

start()
