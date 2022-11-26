require('dotenv').config({path: process.cwd()+"/.env"})
var jwt = require('jsonwebtoken')

module.exports = function() {
    return function(req, res,next){
        const authHeader = req.headers['authorization']
        const token = authHeader && authHeader.split(' ')[1]
        if (token == null) return res.status(401).json({message: "No token provided"})
        jwt.verify(token, process.env.ACCESS_TOKEN_KEY, (err, user) => {
            if (err) {
                res.status(403).json({message: "Invalid token"})
                return
            }
            req.user = user
            next()
        })
    }
}