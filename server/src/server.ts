import express from 'express'

const app = express()

app.get('/users', (request, response) => {
  response.json({'hello': 'world'})
})

app.listen(3333)