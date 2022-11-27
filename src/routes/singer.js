const express = require('express')
const router = express.Router()
const {getSingers} = require('../database/db')
router.get('/', (req, res) => {
    getSingers((result) => {
        if (result.message) {
            res.status(400).json(result)
        } else {
            res.status(200).json({singers : result.map((singer) => {
                return {
                    user_id : singer.user_id,
                    username : singer.username,
                    name : singer.name,
                }      
            })})
        }
    })
})

module.exports = router
    