var fs = require('fs');
const path = require('path')
const os = require('os')
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const keytar = require('keytar')

var isFirstTime = false
const dbFolder = path.join(os.homedir(), ".eden")
if (!fs.existsSync(dbFolder)){
    fs.mkdirSync(dbFolder)
    isFirstTime = true
}
const dbPath = path.join(os.homedir(), ".eden", "db.json")
const adapter = new FileSync(dbPath)
const db = low(adapter)

db.defaults({ username: null, t_down_files: [], uploadSize: 0, history: [] }).write()

const KEYCHAIN_LOGIN = 'network.genaro.eden.login'
const KEYCHAIN_ENCRYPTIONKEY = 'network.genaro.eden.encryptionkey'

/* 插入数据 */
function save(tableName, data) {
    db.get(tableName).push(data).write()
}

/* 查询数据 */
function query(tableName, queryVal) {
    return db.get(tableName).filter(queryVal).value()
}

function addUploadSize(sizeByte) {
    db.set('uploadSize', getUploadSize() + sizeByte).write()
}

function getUploadSize() {
    return db.get('uploadSize').value()
}

function getHistory() {
    return db.get('history').sortBy('created').value()
}

function addHistory(data) {
    db.get('history').push(data).write()
}

function removeHistoryById(id) {
    db.get('history').remove({historyId: id}).write()
}

function saveCredentials(username, password) {
    db.set('username', username).write()
    keytar.setPassword(KEYCHAIN_LOGIN, username, password).then(() => {
        console.log('Credentials saved to keychain')
    })
}

function getCredentials() {
    return new Promise((resolve, reject) => {
        const account = db.get('username').value()
        if(account) {
            keytar.getPassword(KEYCHAIN_LOGIN, account).then((password) => {
                resolve({account, password})
            }).catch(() => {
                console.error('getCredentials from keyChain error!')
                resolve(null)
            })
        } else {
            resolve(null)
        }
    })
}

function deleteCredentials() {
    const account = db.get('username').value()
    db.set('username', null).write()
    return keytar.deletePassword(KEYCHAIN_LOGIN, account)
}

function saveEncryptionKey(key) {
    const account = db.get('username').value()
    keytar.setPassword(KEYCHAIN_ENCRYPTIONKEY, account, key).then(() => {
        console.log('Credentials saved to keychain')
    })
}

function getEncryptionKey() {
    return new Promise((resolve, reject) => {
        const account = db.get('username').value()
        if(account) {
            keytar.getPassword(KEYCHAIN_ENCRYPTIONKEY, account).then((password) => {
                resolve({account, password})
            }).catch(() => {
                console.error('getEncryptionKey from keyChain error!')
                resolve(null)
            })
        } else {
            resolve(null)
        }
    })
}

export default {
    save,
    query,
    addUploadSize,
    getUploadSize,
    isFirstTime,
    getHistory,
    addHistory,
    removeHistoryById,
    saveCredentials,
    getCredentials,
    deleteCredentials,
    saveEncryptionKey,
    getEncryptionKey
}