const API_KEY = 'RGAPI-7a212cce-02c4-44a8-8ade-38130fe79a3e'

async function getSummonerData(summoner) {
    const SUMMONER_URL = `https://la2.api.riotgames.com/lol/summoner/v4/summoners/by-name/${summoner}?api_key=${API_KEY}`
    let responseSummonerData = await fetch(SUMMONER_URL)
    const SUMMONER_DATA = await responseSummonerData.json()
    return SUMMONER_DATA
}

async function getMatchDataList(summonerPuuid) {
    const MATCH_ID_LIST_URL = `https://americas.api.riotgames.com/lol/match/v5/matches/by-puuid/${summonerPuuid}/ids?start=0&count=20&api_key=${API_KEY}`
    let responseMatchIds = await fetch(MATCH_ID_LIST_URL)
    const MATCH_ID_LIST = await responseMatchIds.json()
    
    const MATCH_PROMISES_LIST = MATCH_ID_LIST.map(async id => {
        const MATCH_DATA_URL = `https://americas.api.riotgames.com/lol/match/v5/matches/${id}?api_key=${API_KEY}`
        let responseMatch = await fetch(MATCH_DATA_URL)
        let matchData = await responseMatch.json()
        return matchData
    })
    
    const MATCH_LIST = await Promise.all(MATCH_PROMISES_LIST)
    return MATCH_LIST
}

function matchBox (result) {
    let classType;
    let InnerText;
    if (result) {
        classType = 'won'
        InnerText = 'Ganaste'
    } else {
        classType = 'lost'
        InnerText = 'Perdiste'
    }
    return `<div class="${classType}">${InnerText}</div>`
}
function winListTest(MatchDataList, playerID) {
    let winListArr = MatchDataList.map((match) => {
        let participants = match.metadata.participants
        let idPosition = participants.indexOf(playerID, 0)
        if (idPosition > 4) {
            return match.info.teams[1].win
        } else {
            return match.info.teams[0].win
        }
    })
    return winListArr
}

const button = document.getElementById('summoner-button')
const summonerNameInput = document.getElementById('summoner-input')
const matchesContainer = document.getElementById('match-container')
let summonerData;


button.onclick = function () {
    let summonerName = summonerNameInput.value

    getSummonerData(summonerName).then((summonerPromise) => {
        summonerData = summonerPromise
        summonerPuuid = summonerData.puuid
        
        getMatchDataList(summonerPuuid).then((MatchDataList) => {
            
            // const winList = MatchDataList.map((match) => {
            //     return match.info.teams[0].win
            // })

            winList = winListTest(MatchDataList, summonerPuuid)

            const matchContainerList = winList.map((win) => {
                return matchBox(win)
            })
            matchesContainer.innerHTML = `
            ${matchContainerList.join("")}
            `
        })
    
    })
    
    
}
