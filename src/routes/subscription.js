const express = require('express')
const checkLogin = require('../middlewares/checkLogin')
const checkParams = require('../middlewares/checkParams')
const fetch = (url, body) => import('node-fetch').then(({default: fetch}) => fetch(url,body));
const {DOMParser, XMLSerializer} = require('@xmldom/xmldom')
const {getAdminEmails} = require('../database/db')

let router = express.Router()

router.get('/', checkLogin(), async (req, res) => {
    // fetch from localhost:8080/webservice/ngnotify
    if (req.user.isAdmin !== true){
        res.status(403).send('You are not allowed to do this')
        return
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
                <ser:Auth>ngnotifyrest</ser:Auth>\
            </soapenv:Header>\
            <soapenv:Body>\
            <ser:getSubscriptionList>\
                <!--Optional:-->\
                <arg1>laptop bryan</arg1>\
                <!--Optional:-->\
                <arg2>PENDING</arg2>\
            </ser:getSubscriptionList>\
            </soapenv:Body>\
        </soapenv:Envelope>'
        });
        
        const data = await response.text();

        if (!response.ok) {
            res.status(500).json({ message : 'Soap Server Error' })
            return
        }

        

        var doc = new DOMParser().parseFromString(data, "text/xml");
        subsList = []
        for (let i = 0; i < doc.getElementsByTagName('return').length; i++) {
            val = doc.getElementsByTagName('return')[i].textContent.split(';')
            subsList.push({
                creator_id: val[0],
                subscriber_id: val[1],
                status: val[2],
            })
        }
        if (req.query.page == undefined || req.query.page < 1) {
            req.query.page = 1
        }
        if (req.query.limit == undefined || req.query.limit < 1) {
            req.query.limit = 8
        }
        
        let page = req.query.page - 1
        let limit = req.query.limit
        let total_pages = Math.ceil(subsList.length/limit)
        result = subsList.slice(page * limit, page * limit + limit)
        res.status(200).json({subsList: result, pages: total_pages})
    } catch (error) {
        res.status(500).json({ message : 'Soap Server Error' })
    }
})

router.post('/update', checkLogin(), checkParams(['creator_id', 'subscriber_id', 'status']), async (req, res) => {
    if (req.body["status"] === "ACCEPTED"){
        ser = "acceptSubscription"
    }
    else if (req.body["status"] === "REJECTED"){
        ser = "rejectSubscription"
    }
    else {
        res.status(400).json({ message : 'Bad Request' })
        return
    }
    
    if (req.user.isAdmin !== true){
        res.status(401).json({ message : 'Unauthorized' })
        return
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
                            <ser:Auth>ngnotifyrest</ser:Auth>\
                        </soapenv:Header>\
                        <soapenv:Body>\
                        <ser:'+ser+'>\
                            <!--Optional:-->\
                            <arg1>laptop bryan</arg1>\
                            <!--Optional:-->\
                            <arg2>'+req.body["creator_id"]+'</arg2>\
                            <!--Optional:-->\
                            <arg3>'+req.body["subscriber_id"]+'</arg3>\
                        </ser:'+ser+'>\
                        </soapenv:Body>\
                    </soapenv:Envelope>'
        });

        const data = await response.text();

        if (!response.ok) {
            res.status(500).json({ message : 'Soap Server Error' })
            return
        }

        res.status(200).json({ message : 'Success' })
    } catch (error) {
        res.status(500).json({ message : 'Soap Server Error' })
    }
})

router.get('/adminemails', async (req, res) => {
    getAdminEmails((result) => {
        if (result.message) {
            res.status(400).json(result)
        } else {
            res.status(200).json({data : result})
        }
    })
})

module.exports = router

