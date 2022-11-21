const { Client } = require('pg')
const dotenv = require('dotenv').config({path: process.cwd()+"/.env"})
const bcrypt = require('bcrypt')

const credentials = {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASS,
    port: process.env.DB_PORT,
}

const client = new Client(credentials)
client.connect()

// getSongs
const getUser = (callback) => {
    client.query('SELECT * FROM users', (err, res) => {
        if (err) {
            console.log(err.stack)
        } else {
            callback(res.rows[0])
        }
    })
}

const register = (params, callback) => {
    // Query Check if username or email already exists
    client.query('SELECT * FROM users WHERE username = $1 OR email = $2', [params["username"], params["email"]], (err, res) => {
        if (err) {
            console.log(err.stack)
            callback({message: "Error registering user"})
        } else {
            if (res.rows.length > 0) {
                callback({message: "Username or email already exists"})
            } else {
                bcrypt.hash(params["password"], 10, (err, hash) => {
                    if (err) {
                        console.log(err)
                        callback({message: "Error registering user"})
                    } else {
                        query = 'INSERT INTO users (username, email, password, name, "isAdmin") VALUES ($1, $2, $3, $4, $5) RETURNING *'
                        values = [params["username"], params["email"], hash, params["name"], false]
                        client.query(query,values, (err, res) => {
                            if (err) {
                                console.log(err.stack)
                                callback({message: "Error registering user"})
                            } else {
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
            console.log(err.stack)
            callback({message: "Error logging in"})
        } else {
            if (res.rows.length > 0) {
                bcrypt.compare(params["password"], res.rows[0]["password"], (err, result) => {
                    if (err) {
                        console.log(err)
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

module.exports = {
    getUser,
    register,
    login
}

