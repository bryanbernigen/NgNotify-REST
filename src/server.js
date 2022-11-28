const express = require('express')
const cors = require('cors')

const app = express()

app.use(
    cors({
        origin: '*',
    })
)

const port = process.env.PORT || 3000
const auth = require('./routes/auth')
const songs  = require('./routes/songs')
const subscription = require('./routes/subscription')
const checkLogin = require('./middlewares/checkLogin')
const singer = require('./routes/singer')
const user = require('./routes/user')


app.use(express.json())
app.use("/auth", auth)
app.use("/songs", songs)
app.use("/subscription", subscription)
app.use("/singers", singer)
app.use("/user", user)
app.get('/', checkLogin(), (req, res) => res.send('Hello World!'))

app.listen(port, () => console.log(`App listening on port ${port}!`))