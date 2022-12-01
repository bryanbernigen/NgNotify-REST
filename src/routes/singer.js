const express = require('express')
const router = express.Router()
const {getSingers} = require('../database/db')
const {cachedGet, cacheSet} = require('../database/redis')
const checkParams = require('../middlewares/checkParams')
const fetch = (url, body) => import('node-fetch').then(({default: fetch}) => fetch(url,body));
const {DOMParser, XMLSerializer} = require('@xmldom/xmldom')
const dotenv = require('dotenv').config({path: process.cwd()+"/.env"})
router.post('/', checkParams(['user_id']) ,cachedGet("singers"), async (req, res) => { 
    if (req.cached) {
        toSend = JSON.parse(req.cacheVal)
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
            <soapenv:Header>\
               <ser:Auth>' +process.env.SOAP_KEY+'</ser:Auth>\
            </soapenv:Header>\
            <soapenv:Body>\
               <ser:getSingleUserSubscriptionList>\
                  <!--Optional:-->\
                  <arg1>laptop bryan</arg1>\
                  <arg2>'+req.body['user_id']+'</arg2>\
               </ser:getSingleUserSubscriptionList>\
            </soapenv:Body>\
         </soapenv:Envelope>'
        });
        if (!response.ok) {
            res.status(500).json({ message : 'Soap Server Error' })
            return
        }
        
        const data = await response.text();
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
        // Stale while revalidate
        res.set('Cache-Control', 'max-age=10, stale-while-revalidate=50')
        res.status(200).json({data : toSend})
    } catch (error) {
        res.status(500).json({ message : "Soap Server Error Internal" })
    }
})

module.exports = router
    