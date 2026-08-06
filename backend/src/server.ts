import express from 'express'

const app = express()
const port = 3000

app.get('/ping', (req, res) => {
    res.send('Pong!')
})

app.listen(port, () => {
    console.log(`Server running on port ${port}`)
})