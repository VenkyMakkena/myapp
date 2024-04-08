const express = require('express')
const path = require('path')

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const app = express()

const dbPath = path.join(__dirname, 'cricketMatchDetails.db')
app.use(express.json())

let database = null

const initilizeDBAndServer = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initilizeDBAndServer()

const convertDbObject = objectItem => {
  return {
    playerId: objectItem.player_id,
    playerName: objectItem.player_name,
  }
}

const convertDbMatchObject = objectItem => {
  return {
    matchId: objectItem.match_id,
    match: objectItem.match,
    year: objectItem.year,
  }
}

const convertDbPlayerMatchObject = objectItem => {
  return {
    playerMatchId: objectItem.player_match_id,
    playerId: objectItem.player_id,
    matchId: objectItem.match_id,
    score: objectItem.score,
    fours: objectItem.fours,
    sixes: objectItem.sixes,
  }
}

app.get('/players/', async (request, response) => {
  const getPlayersQuery = `select * from player_details`
  const getPlayersQueryResponse = await database.all(getPlayersQuery)
  response.send(
    getPlayersQueryResponse.map(eachPlayer => convertDbObject(eachPlayer)),
  )
})

// get the player details based on the player id
// API 2

app.get('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const getPlayerDetailsQuery = `select * from player_details where 
  player_id = ${playerId};`
  const getPlayerDetailsQueryResponse = await database.get(
    getPlayerDetailsQuery,
  )
  response.send(convertDbObject(getPlayerDetailsQueryResponse))
})

//post a player into data base
// API 3

app.put('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const {playerName} = request.body
  const updatePlayerDetailsQuery = `update player_details set 
  player_name = '${playerName}' 
  where player_id = ${playerId};`
  await database.run(updatePlayerDetailsQuery)
  response.send('Player Details Updated')
})

// API 4

app.get('/matches/:matchId/', async (request, response) => {
  const {matchId} = request.params
  const getPlayerDetailsQuery = `select * from match_details where 
  match_id = ${matchId};`
  const getPlayerDetailsQueryResponse = await database.get(
    getPlayerDetailsQuery,
  )
  response.send(convertDbMatchObject(getPlayerDetailsQueryResponse))
})

// API 5

app.get('/players/:playerId/matches/', async (request, response) => {
  const {playerId} = request.params
  const getPlayerMatchQuery = `select * from player_match_score natural join match_details where 
  player_id = ${playerId};`
  const playerMatches = await database.all(getPlayerMatchQuery)
  response.send(playerMatches.map(eachMatch => convertDbMatchObject(eachMatch)))
})

//API 6

app.get('/matches/:matchId/players/', async (request, response) => {
  const {matchId} = request.params
  const getMatchPlayerDetailsQuery = `select * from player_match_score natural join player_details where 
  match_id = ${matchId};`
  const getMatchPlayerDetailsQueryResponse = await database.all(
    getMatchPlayerDetailsQuery,
  )
  response.send(
    getMatchPlayerDetailsQueryResponse.map(eachPlayer =>
      convertDbObject(eachPlayer),
    ),
  )
})

//update the details of the player using player ID
// API 7

app.get('/players/:playerId/playerScores/', async (request, response) => {
  const {playerId} = request.params
  const getPlayermatchQuery = `select player_id as playerId, player_name as playerName, sum(score) as totalScore,sum(fours) as totalFours, sum(sixes) as totalSixes from player_match_score natural join player_details where 
  player_id = ${playerId};`
  const playerMatchDetails = await database.get(getPlayermatchQuery)
  response.send(playerMatchDetails)
})

module.exports = app
