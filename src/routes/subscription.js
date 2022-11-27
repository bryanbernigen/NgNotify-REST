const express = require('express')
const checkLogin = require('../middlewares/checkLogin')
const checkParams = require('../middlewares/checkParams')
const fetch = (url, body) => import('node-fetch').then(({default: fetch}) => fetch(url,body));
const {DOMParser, XMLSerializer} = require('@xmldom/xmldom')

let router = express.Router()

router.get('/', checkLogin(), async (req, res) => {
    // fetch from localhost:8080/webservice/ngnotify
    if (req.user.isAdmin !== true){
        res.status(403).send('You are not allowed to do this')
        return
    }
    try {
        const response = await fetch('http://localhost:8080/webservice/ngnotify', {
            method: 'POST',
            headers: {
                'Content-Type': 'text/xml; charset=utf-8',
                'Accept': 'text/xml'
            },
            body: '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://services.ngnotify/">\
            <soapenv:Header/>\
            <soapenv:Body>\
            <ser:getSubscriptionList>\
                <!--Optional:-->\
                <arg0>laptop bryan</arg0>\
                <!--Optional:-->\
                <arg1>PENDING</arg1>\
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
        res.status(200).json({subsList: subsList})
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
        const response = await fetch('http://localhost:8080/webservice/ngnotify', {
            method: 'POST',
            headers: {
                'Content-Type': 'text/xml; charset=utf-8',
                'Accept': 'text/xml'
            },
            body: '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://services.ngnotify/">\
                        <soapenv:Header/>\
                        <soapenv:Body>\
                        <ser:'+ser+'>\
                            <!--Optional:-->\
                            <arg0>laptop bryan</arg0>\
                            <!--Optional:-->\
                            <arg1>'+req.body["creator_id"]+'</arg1>\
                            <!--Optional:-->\
                            <arg2>'+req.body["subscriber_id"]+'</arg2>\
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

module.exports = router

