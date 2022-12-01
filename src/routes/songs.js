const express = require('express')
const checkLogin = require('../middlewares/checkLogin')
const checkParams = require('../middlewares/checkParams')
const {getSong, addSong, editSong, deleteSong, getPremiumSongs} = require('../database/db')
const fetch = (url, body) => import('node-fetch').then(({default: fetch}) => fetch(url,body));
const {DOMParser, XMLSerializer} = require('@xmldom/xmldom')

let router = express.Router()

router.get('/',async (req, res) => {
        getSong(req.query["penyanyi_id"], (result) => {
            if (result.message) {
                res.status(400).json(result)
            } else {
                if (req.query.page == undefined || req.query.page < 1) {
                    req.query.page = 1
                }
                if (req.query.limit == undefined || req.query.limit < 1) {
                    req.query.limit = 8
                }
                
                let page = req.query.page - 1
                let limit = req.query.limit
                let total_pages = Math.ceil(result.length/limit)
                result = result.slice(page * limit, page * limit + limit)
                res.status(200).json({data : result, pages:total_pages})
            }
        })
    }
)

router.post('/add', [checkLogin(), checkParams(["judul", "audio_path", "image_path", "duration"])], async (req, res) => {
        addSong(req.body, req.user.user_id, (result) => {
            if (result.message) {
                res.status(400).json(result)
            } else {
                res.status(200).json({
                    data: result
                })
            }
        })
    }
)

router.post('/edit', [checkLogin(), checkParams(["song_id", "judul", "audio_path", "image_path", "duration"])], async (req, res) => {
        editSong(req.body, req.user.user_id, (result) => {
            if (result.message) {
                res.status(400).json(result)
            } else {
                res.status(200).json({
                    data: result
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
                    data: result
                })
            }
        })
    }
)

router.post('/fetch', [checkParams(["penyanyi_id", "user_id"])], async (req, res) => {
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
                        <ser:checkStatus>\
                            <!--Optional:-->\
                            <arg1>laptop bryan</arg1>\
                            <arg2>'+req.body["penyanyi_id"]+'</arg2>\
                            <arg3>'+req.body["user_id"]+'</arg3>\
                        </ser:checkStatus>\
                        </soapenv:Body>\
                    </soapenv:Envelope>\
            '
            });
            
            const data = await response.text();

            if (!response.ok) {            
                res.status(500).json({ message : 'Soap Server Error' })
                return
            }
            if (data.includes("failed")){
                console.log(data);
                res.status(500).json({ message : 'Soap Server Error' })
                return
            }

            var doc = new DOMParser().parseFromString(data, "text/xml");
            subbed = doc.getElementsByTagName("return")[0].childNodes[0].nodeValue
            if (subbed == "ACCEPTED") {
                getSong(req.body["penyanyi_id"], (result) => {
                    if (result.message) {
                        res.status(400).json(result)
                    } else {
                        res.status(200).json({data : result})
                    }
                })
            }
            else{
                res.status(500).json({ message : 'Rejected' })
            }
        } catch (error) {
            res.status(500).json({ message : error })
        }
    }   
)

router.post('/premiumsongs', checkParams(["user_id"]), async (req, res) => {
    const songs = await getPremiumSongs()
    if (songs.message) {
        res.status(400).json(songs)
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

        subscptionList = []
        for (let i = 0; i < doc.getElementsByTagName('return').length; i++) {
            val = doc.getElementsByTagName('return')[i].textContent.split(';')
            if(val[1]=="ACCEPTED"){
                subscptionList.push(val[0])
            }
        }

        result = []
        for (let i = 0; i < subscptionList.length; i++) {
            for (let j = 0; j < songs.length; j++) {
                if (subscptionList[i] == songs[j].penyanyi_id) {
                    result.push(songs[j])
                }
            }
        }
        res.status(200).json({data : result})
        
    } catch (error) {
        res.status(500).json({ message : "Soap Server Error Internal" })
    }
})  

module.exports = router
