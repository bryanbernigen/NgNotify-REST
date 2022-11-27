const express = require('express')
const checkLogin = require('../middlewares/checkLogin')
const checkParams = require('../middlewares/checkParams')
const {getSong, addSong, editSong, deleteSong } = require('../database/db')
const fetch = (url, body) => import('node-fetch').then(({default: fetch}) => fetch(url,body));
const {DOMParser, XMLSerializer} = require('@xmldom/xmldom')

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

router.post('/add', [checkLogin(), checkParams(["judul", "audio_path"])], async (req, res) => {
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

router.post('/edit', [checkLogin(), checkParams(["song_id", "judul", "audio_path"])], async (req, res) => {
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

router.get('/fetch', [checkLogin()], async (req, res) => {
        if (req.user.isAdmin == true ){
            res.status(403).json({message: "You are not allowed to do this"})
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
                    <ser:checkStatus>\
                        <!--Optional:-->\
                        <arg0>laptop bryan</arg0>\
                        <arg1>1</arg1>\
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
            subbed = doc.getElementsByTagName("return")[0].childNodes[0].nodeValue.split(";");
            var promises = []
            subbed.forEach((penyanyi_id) => {
                console.log(penyanyi_id);
                promises.push(new Promise((resolve, reject) => {
                    getSong(parseInt(penyanyi_id), (result) => {
                        if (result.message) {
                            reject(result)
                        } else {
                            console.log(result)
                            resolve(result)
                        }
                    })
                }))
            })
            Promise.all(promises).then((values) => {
                toreturn = []
                values.forEach((value) => {
                    toreturn.push(value[0])
                })
                res.status(200).json({songs : toreturn})
            }).catch((err) => {
                res.status(500).json({ message : 'Soap Server Error' })
            })
        } catch (error) {
            res.status(500).json({ message : 'Soap Server Error' })
        }
    }   
)




module.exports = router
