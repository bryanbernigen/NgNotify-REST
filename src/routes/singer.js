const express = require('express')
const router = express.Router()
const {getSingers} = require('../database/db')
const {cachedGet, cacheSet} = require('../database/redis')
router.get('/', cachedGet("singers"),(req, res) => {
    getSingers((result) => {
        if (result.message) {
            res.status(400).json(result)
            return
        } else {
            toSend =  result.map((singer) => {
                return {
                    user_id : singer.user_id,
                    username : singer.username,
                    name : singer.name,
                }      
            })
            cacheSet("singers", JSON.stringify(toSend))
            res.status(200).json({data : toSend})
        }
    })
})

module.exports = router
    