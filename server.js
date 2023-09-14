const express = require('express')
const path = require('path')
const bodyParser = require('body-parser')
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database(path.join(__dirname, 'db', 'data.db'));

const app = express()
const port = 3000


app.set('view engine', 'ejs')
app.use(express.static('public'))

app.use(bodyParser.urlencoded({ extended: false }))

app.use(bodyParser.json())

app.get('/', (req, res) => {
    const { page = 1, name, height, weight, startdate, enddate, married, radioOperator } = req.query

    const limit = 3
    const offset = (page - 1) * 3


    const queries = []
    const params = []


    if (name) {
        queries.push(`name like '%' || ? || '%'`)
        params.push(name)
    }

    if (height) {
        queries.push(`height = ?`)
        params.push(height)
    }

    if (weight) {
        queries.push(`weight = ?`)
        params.push(weight)
    }

    if (startdate && enddate) {
        queries.push(`birthdate BETWEEN ? and ?`)
        params.push(startdate, enddate)
    } else if(startdate){
        queries.push(`birthdate >= ?`)
        params.push(startdate)
    } else if(enddate){
        queries.push(`birthdate <= ?`)
        params.push(enddate)
    }

    if (married) {
        queries.push(`married = ?`)
        params.push(married)
    }

    let sql = 'SELECT COUNT(*) AS total FROM data'

    if (queries.length > 0) {
        sql += ` WHERE ${queries.join(` ${radioOperator} `)}`
    }

    db.get(sql, params, (err, data) => {

        const url = req.url == '/' ? '/?page=1' : req.url
        const total = data.total
        const pages = Math.ceil(total / limit)

        sql = 'SELECT * FROM data'


        if (queries.length > 0) {
            sql += ` WHERE ${queries.join(` ${radioOperator} `)}`
        }

        sql += ' ORDER BY id DESC'

        sql += ` LIMIT ? OFFSET ?`
        params.push(limit, offset)

        db.all(sql, params, (err, rows) => {
            if (err) return res.send(err)
            res.render('list', { data: rows, query: req.query, pages, offset, page, url })
        })
    })
})

app.get('/add', (req, res) => {
    res.render('add')
})

app.post('/add', (req, res) => {
    db.run('INSERT INTO data(name,height,weight,birthdate,married)VALUES(?,?,?,?,?)', [req.body.name, req.body.height, req.body.weight, req.body.birthdate, req.body.married], (err) => {
        if (err) return res.send(err)
        res.redirect('/')
    })
})


app.get('/delete/:id', (req, res) => {
    db.run('DELETE FROM data WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.send(err)
        res.redirect('/')
    })

})

app.get('/update/:id', (req, res) => {
    db.get('SELECT * FROM data WHERE id = ?', [req.params.id], (err, tier) => {
        if (err) return res.send(err)
        res.render('update', { tier })
    })
})

app.post('/update/:id', (req, res) => {
    db.run('UPDATE data SET name = ?,height = ?,weight = ?,birthdate = ?,married = ? WHERE id = ?', [req.body.name, req.body.height, req.body.weight, req.body.birthdate, req.body.married, req.params.id], (err) => {
        if (err) return res.send(err)
        res.redirect('/')
    })
})

app.listen(port, () => {
    console.log(`JSONcrud app listening on port ${port}`)
})