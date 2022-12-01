const express = require('express')
const checkLogin = require('../middlewares/checkLogin')
const checkParams = require('../middlewares/checkParams')
const fetch = (url, body) => import('node-fetch').then(({default: fetch}) => fetch(url,body));
const {DOMParser, XMLSerializer} = require('@xmldom/xmldom')
const {getAdminEmails, getSingerPromise, getUserPromise} = require('../database/db')

let router = express.Router()
router.get('/test', async (req, res) => {
    const result = await getUserPromise()
    res.json(result["data"])
})

router.get('/', checkLogin(), async (req, res) => {
    // fetch from localhost:8080/webservice/ngnotify
    // if (req.user.isAdmin !== true){
    //     res.status(403).send('You are not allowed to do this')
    //     return
    // }
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

        const singers = await getSingerPromise()
        const users = await getUserPromise()

        // TODO: get user info from database
        singerDict = {}
        singers.forEach(singer => {
            singerDict[singer.user_id] = singer
        })

        usersData = users["data"]
        usersDict = {}
        usersData.forEach(user => {
            usersDict[user.user_id] = user
        })

        for (let i = 0; i < subsList.length; i++) {
            if (singerDict[subsList[i].creator_id] == undefined) {
                subsList[i].nama_penyanyi = undefined
            } else {
                subsList[i].nama_penyanyi = singerDict[subsList[i].creator_id].name
            }

            if (usersDict[subsList[i].subscriber_id] == undefined) {
                subsList[i].nama_subscriber = undefined
            }
            else {
                subsList[i].nama_subscriber = usersDict[subsList[i].subscriber_id].username
            }
        }
        subsList = subsList.filter(subs => subs.nama_penyanyi != undefined)

        let page = req.query.page - 1
        let limit = req.query.limit
        let total_pages = Math.ceil(subsList.length/limit)
        result = subsList.slice(page * limit, page * limit + limit)
        res.status(200).json({subsList: result, pages: total_pages})
    } catch (error) {
        res.status(500).json({ message : 'Internal Server Error' })
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

        if (data.includes("fail")){
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

router.post('/subscribe', checkParams(["id", "current_user"]),async (req, res) => {
    const response = await fetch('http://localhost:8070/webservice/ngnotify', {
            method: 'POST',
            headers: {
                'Content-Type': 'text/xml; charset=utf-8',
                'Accept': 'text/xml'
            },
            body: '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://services.ngnotify/">\
                        <soapenv:Header>\
                            <ser:Auth>ngnotifyvanilla</ser:Auth>\
                        </soapenv:Header>\
                        <soapenv:Body>\
                            <ser:newSubscription>\
                                <!--Optional:-->\
                                <arg1>laptop bryan</arg1>\
                                <arg2>'+req.body["id"]+'</arg2>\
                                <arg3>'+req.body["current_user"]+'</arg3>\
                                <!--Optional:-->\
                                <arg4>image_path</arg4>\
                            </ser:newSubscription>\
                        </soapenv:Body>\
                    </soapenv:Envelope>'
        });

        const data = await response.text();

        if (!response.ok) {
            res.status(500).json({ message : 'Soap Server Error' })
            return
        }

        res.status(200).json({ message : 'Success' })
    } 
)
    


module.exports = router

