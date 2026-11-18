// server/index.js
// Optional standalone Express server kept for running the API independently
// (`npm run server`). The Next.js app uses server/app.js through a route handler.

import app from './app.js'

const PORT = process.env.PORT || 3001

app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`)
})
