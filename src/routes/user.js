const express = require('express')
const checkLogin = require('../middlewares/checkLogin')
let router = express.Router()

router.get('/',checkLogin(), async (req, res) => {
        res.status(200).json({user: req.user})
    }
)

module.exports = router;

