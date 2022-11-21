const express = require('express')

const app = express()
const port = process.env.PORT || 3000
const auth = require('./routes/auth')
const checkLogin = require('./middlewares/checkLogin')

app.use(express.json())
app.use("/auth", auth)
app.get('/', checkLogin(), (req, res) => res.send('Hello World!'))

app.listen(port, () => console.log(`App listening on port ${port}!`))