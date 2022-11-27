require('dotenv').config({path: process.cwd()+"/.env"})
const checkParams = require('../middlewares/checkParams')
const {register, login} = require('../database/db')
const {cacheDelete} = require('../database/redis')
const express = require('express')
let router = express.Router()
var jwt = require('jsonwebtoken')

router.post('/login',checkParams(["emailuser", "password"]),(req, res) => {
    login(req.body, (data) => {
        if (data.message) {
            res.status(401).json(data)
        } else {
            user_info = {
                user_id: data.user_id,
                username: data.username,
                email: data.email,
                name: data.name,
                isAdmin: data.isAdmin
            }
            const accessToken = jwt.sign(user_info, process.env.ACCESS_TOKEN_KEY, {expiresIn: '1h'})
            res.status(200).json({accessToken: accessToken})
        }
    })
})

router.post('/register', checkParams(["email", "password", "username", "name"]),(req, res, next) => {
    register(req.body, (result) => {
        if (result.message) {
            res.status(400).json(result)
        } else {
            res.status(200).json(result)
            cacheDelete("singers")
        }
    }
)})
module.exports = router;