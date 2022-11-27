const redis = require('redis')

const cache = redis.createClient()
cache.connect()

function cachedGet(key) {
    return  async function(req, res, next){
        val = await cache.get(key)
        if (val === null) {
            next()
        } else {
            res.status(200).json({data: JSON.parse(val)})
            console.log('cache hit');
            return
        }
    }
}

function cacheSet(key, val){
    cache.set(key, val)
}

function cacheDelete(key){
    cache.del(key)
}

module.exports = {
    cachedGet,
    cacheSet,
    cacheDelete
}