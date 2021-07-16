import express from 'express';
import { join } from 'path'
import { Low, JSONFile } from 'lowdb'
import lodash from 'lodash'
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import cors from 'cors'
import bodyParser from 'body-parser'
import fetch from 'node-fetch'
import supp_countries from './supp_countries.js'

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();

const file = join(__dirname, 'db.json')
const adapter = new JSONFile(file)
const db = new Low(adapter)

app.use(express.static("dist"))
app.use(cors())
app.use(bodyParser.json())

await db.read()
db.data || (db.data = { countries: [] })
db.chain = lodash.chain(db.data)

app.get('/', (req, res) => {
  res.sendFile(__dirname + "/dist/index.html")
})

app.get('/pins', (req, res) => {
  const countries = db.chain.get("countries").value()
  res.send(countries)
})

app.post('/search', async (req, res) => {
  // search for matches among the supplemental countries
  const lcaseCountries = supp_countries.countries.map((item) => item.name.toLowerCase())
  let matches = lcaseCountries.filter(c => c.includes(req.body.query))
  matches = matches.map(item => supp_countries.countries.filter(c => c.name.toLowerCase() == item)[0])

  // search for matches via restcountries API
  let restData = []
  await fetch(`https://restcountries.eu/rest/v2/name/${req.body.query}`)
  .then((response) => {
    if (!response.ok) {
      res.sendStatus(500)
      throw Error(response.statusText)
    }
    return response.json()
  })
  .then(data => { restData = data })
  .catch((err) => {
    console.log(err)
    throw Error(err)
  })

  // combine both sets of results and sort alphabetically
  restData = restData.concat(matches)
  restData.sort((a, b) => a.name.localeCompare(b.name) )

  res.status(200).send(restData)
})

app.post('/addPin', (req, res) => {
  // set to country if it exists, else is undefined
  const exists = db.chain.get('countries').find({name: req.body.name}).value()
  if (!exists) { // if the country is not in the db, add it
    db.data.countries.push(req.body)
    db.write()
    res.sendStatus(200)
  }
})

app.post('/remPin', (req, res) => {
  lodash.remove(db.data.countries, (c) => c.name == req.body.name)
  db.write()
  res.sendStatus(200)
})

// app.listen(process.env.PORT || 3000)
app.listen(3000, () => { console.log("Listening on 3000") })