const express = require('express')
const checkLogin = require('../middlewares/checkLogin')
const checkParams = require('../middlewares/checkParams')
const {getSong, addSong, editSong, deleteSong } = require('../database/db')
let router = express.Router()

router.get('/',checkLogin(), async (req, res) => {
        getSong(req.user.user_id, (result) => {
            if (result.message) {
                res.status(400).json(result)
            } else {
                res.status(200).json({songs : result})
            }
        })
    }
)

router.post('/add', [checkLogin(), checkParams(["judul", "Audio_path"])], async (req, res) => {
        addSong(req.body, req.user.user_id, (result) => {
            if (result.message) {
                res.status(400).json(result)
            } else {
                res.status(200).json({
                    created: result
                })
            }
        })
    }
)

router.post('/edit', [checkLogin(), checkParams(["song_id", "judul", "Audio_path"])], async (req, res) => {
        editSong(req.body, req.user.user_id, (result) => {
            if (result.message) {
                res.status(400).json(result)
            } else {
                res.status(200).json({
                    edited: result
                })
            }
        })
    }
)

router.post('/delete', [checkLogin(), checkParams(["song_id"])], async (req, res) => {
        deleteSong(req.body, req.user.user_id, (result) => {
            if (result.message) {
                res.status(403).json(result)
            } else {
                res.status(200).json({
                    deleted: result
                })
            }
        })
    }
)

module.exports = router
