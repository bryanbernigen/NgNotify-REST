const express = require('express')
const router = express.Router()
const {getSingers} = require('../database/db')
const {cachedGet, cacheSet} = require('../database/redis')
const checkLogin = require('../middlewares/checkLogin')
router.get('/', checkLogin(), cachedGet("singers"), async (req, res) => {
    
    if (req.cached) {
        toSend = req.cached
    } else {
        const result = await getSingers()
        if (result.message) {
            res.status(400).json(result)
            return
        } else {
            toSend =  result.map((singer) => {
                return {
                    user_id : singer.user_id,
                    username : singer.username,
                    name : singer.name,
                    image_path : singer.image_path,
                }      
            })
            cacheSet("singers", JSON.stringify(toSend))
        }
    }
    try {
        const response = await fetch('http://localhost:8070/webservice/ngnotify', {
            method: 'POST',
            headers: {
                'Content-Type': 'text/xml; charset=utf-8',
                'Accept': 'text/xml'
            },
            body: '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://services.ngnotify/">\
            <soapenv:Header/>\
            <soapenv:Body>\
               <ser:getSingleUserSubscriptionList>\
                  <!--Optional:-->\
                  <arg0>laptop bryan</arg0>\
                  <arg1>' + req.user.user_id+'</arg1>\
               </ser:getSingleUserSubscriptionList>\
            </soapenv:Body>\
         </soapenv:Envelope>'
        });
        
        const data = await response.text();

        if (!response.ok) {
            res.status(500).json({ message : 'Soap Server Error' })
            return
        }

        var doc = new DOMParser().parseFromString(data, "text/xml");
        subsDict = {}
        for (let i = 0; i < doc.getElementsByTagName('return').length; i++) {
            val = doc.getElementsByTagName('return')[i].textContent.split(';')
            subsDict[val[0]] = val[1]
        }

        for (let i = 0; i < toSend.length; i++) {
            if (subsDict[toSend[i].user_id]) {
                toSend[i].status = subsDict[toSend[i].user_id]
            } else {
                toSend[i].status = null
            }
        }
        res.status(200).json({data : toSend})
    } catch (error) {
        res.status(500).json({ message : 'Soap Server Error' })
    }
})

module.exports = router
    