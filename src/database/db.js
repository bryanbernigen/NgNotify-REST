const { Client } = require('pg')
const dotenv = require('dotenv').config({path: process.cwd()+"/.env"})
const bcrypt = require('bcrypt')
const fetch = (url, body) => import('node-fetch').then(({default: fetch}) => fetch(url,body));

const credentials = {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASS,
    port: process.env.DB_PORT,
}

const client = new Client(credentials)
client.connect()

const getAdminEmails = (callback) => {
    client.query('SELECT email FROM users WHERE "isAdmin" = true', (err, res) => {
        if (err) {
            callback({message: "Error getting admins"})
        } else {
            if (res.rows.length > 0) {
                callback(res.rows)
            }
            else{
                callback({message: "No admins found"})
            }
        }
    })
}

// getSongs
const getUser = (callback) => {
    client.query('SELECT * FROM users', (err, res) => {
        if (err) {
            callback({message: "Error getting users"})
        } else {
            callback(res.rows[0])
        }
    })
}

const getSingerPromise = () => {
    return new Promise((resolve, reject) => {
        client.query('SELECT * FROM users WHERE "isAdmin" = False', (err, res) => {
            if (err) {
                reject(err)
            } else {
                resolve(res.rows)
            }
        })
    })
}

const getUserPromise = () => {
    return new Promise(async (resolve, reject) => {
        //fetch from localhost:8000/users
        try {
            const response = await fetch('http://localhost:8000/api/userapi/showalluser')
            const data = await response.json()
            resolve(data)
        }
        catch (err) {
            reject(err)
        }
    })
}

const register = (params, callback) => {
    // Query Check if username or email already exists
    client.query('SELECT * FROM users WHERE username = $1 OR email = $2', [params["username"], params["email"]], (err, res) => {
        if (err) {
            callback({message: "Error registering user"})
        } else {
            if (res.rows.length > 0) {
                callback({message: "Username or email already exists"})
            } else {
                bcrypt.hash(params["password"], 10, (err, hash) => {
                    if (err) {
                        callback({message: "Error registering user"})
                    } else {
                        query = 'INSERT INTO users (username, email, password, name, "isAdmin", image_path) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *'
                        values = [params["username"], params["email"], hash, params["name"],false, params["image_path"]]
                        client.query(query,values, (err, res) => {
                            if (err) {
                                callback({message: "Error registering user"})
                            } else {
                                delete res.rows[0]["password"]
                                callback(res.rows[0])
                            }
                        })
                    }
                })
            }
        }
    })
}

const login = (params, callback) => {
    client.query('SELECT * FROM users WHERE username = $1 OR email = $2', [params["emailuser"], params["emailuser"]], (err, res) => {
        if (err) {
            callback({message: "Error logging in"})
        } else {
            if (res.rows.length > 0) {
                bcrypt.compare(params["password"], res.rows[0]["password"], (err, result) => {
                    if (err) {
                        callback({message: "Error logging in"})
                    } else {
                        if (result) {
                            callback(res.rows[0])
                        } else {
                            callback({message: "Incorrect password"})
                        }
                    }
                })
            } else {
                callback({message: "User does not exist"})
            }
        }
    })
}

const getSong = (penyanyi_id, callback) => {
    client.query('select penyanyi_id, song_id, judul, name AS penyanyi, duration, audio_path, s.image_path from songs s JOIN users u ON s.penyanyi_id = u.user_id WHERE penyanyi_id = $1 ', [penyanyi_id], (err, res) => {
        if (err) {
            callback({message: "Error getting song"})
        } else {
            callback(res.rows)
        }
    })
}

const addSong = (params, penyanyi_id, callback) => {
    client.query('INSERT INTO songs (judul, audio_path, penyanyi_id, image_path, duration) VALUES ($1, $2, $3, $4, $5) RETURNING *', [params["judul"], params["audio_path"], penyanyi_id, params["image_path"], params["duration"]], (err, res) => {
        if (err) {
            callback({message: "Error adding song"})
        } else {
            callback(res.rows[0])
        }
    })
}


const editSong = (params, penyanyi_id, callback) => {
    client.query('UPDATE songs SET Judul = $1, audio_path = $2, image_path = $5, duration = $6 WHERE penyanyi_id = $3 AND song_id = $4 RETURNING *', [params["judul"], params["audio_path"], penyanyi_id, params["song_id"], params["image_path"], params["duration"]], (err, res) => {
        if (err) {
            callback({message: "Error editing song"})
        } else {
            if (res.rows.length > 0) {
                callback(res.rows[0])
            }
            else{
                callback({message: "Song not found"})
            }
        }
    })
}

const deleteSong = (params, penyanyi_id, callback) => {
    client.query('DELETE FROM songs WHERE penyanyi_id = $1 AND song_id = $2 RETURNING *', [penyanyi_id, params["song_id"]], (err, res) => {
        if (err) {
            callback({message: "Error deleting song"})
        } else {
            if (res.rows.length > 0) {
                callback(res.rows[0])
            }
            else{
                callback({message: "Song not found"})
            }
        }
    })
}

const getSingers = () => {
    return new Promise((resolve, reject) => {
        client.query('SELECT * FROM users WHERE "isAdmin" = false', (err, res) => {
            if (err) {
                resolve({message: "Error getting singers"})
            } else {
                if (res.rows.length > 0) {
                    resolve(res.rows)
                }
                else{
                    resolve({message: "No singers found"})
                }
            }
        })
    })

}

const checkUniqueEmail = (email, callback) => {
    client.query("SELECT * FROM users WHERE email = $1", [email], (err, res) => {
        if (err) {
            callback({message: "Error checking email"})
        } else {
            if (res.rows.length > 0) {
                callback({status:"false"})
            }
            else{
                callback({status:"true"})
            }
        }
    })
}

const checkUniqueUsername = (username, callback) => {
    client.query("SELECT * FROM users WHERE username = $1", [username], (err, res) => {
        if (err) {
            callback({message: "Error checking username"})
        } else {
            if (res.rows.length > 0) {
                callback({status:"false"})
            }
            else{
                callback({status:"true"})
            }
        }
    })
}

const getPremiumSongs = (callback) => {
    return new Promise((resolve, reject) => {
        client.query('select penyanyi_id, song_id, judul, name AS penyanyi, duration, audio_path, s.image_path from songs s JOIN users u ON s.penyanyi_id = u.user_id', (err, res) => {
        if (err) {
            resolve({message: "Error getting premium songs"})
        } else {
            if (res.rows.length > 0) {
                resolve(res.rows)
            }
            else{
                resolve({message: "No premium songs found"})
            }
        }
    })
    })
}

module.exports = {
    getUser,
    getSingerPromise,
    getUserPromise,
    register,
    login,
    getSong,
    addSong,
    editSong,
    deleteSong,
    getSingers,
    getAdminEmails,
    checkUniqueEmail,
    checkUniqueUsername,
    getPremiumSongs
}

