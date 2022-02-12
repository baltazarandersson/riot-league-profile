const API_KEY = 'RGAPI-16fa74ca-c565-4842-b428-fc7e6a1913e3'

async function getSummonerData(summoner) {
    const SUMMONER_URL = `https://la2.api.riotgames.com/lol/summoner/v4/summoners/by-name/${summoner}?api_key=${API_KEY}`
    let responseSummonerData = await fetch(SUMMONER_URL)
    const summonerData = await responseSummonerData.json()
    return summonerData
}

async function getMatchDataList(summonerPuuid) {
    const MATCH_ID_LIST_URL = `https://americas.api.riotgames.com/lol/match/v5/matches/by-puuid/${summonerPuuid}/ids?start=0&count=10&api_key=${API_KEY}`
    let responseMatchIds = await fetch(MATCH_ID_LIST_URL)
    const matchIdList = await responseMatchIds.json()
    
    const matchPromisesList = matchIdList.map(async id => {
        const MATCH_DATA_URL = `https://americas.api.riotgames.com/lol/match/v5/matches/${id}?api_key=${API_KEY}`
        let responseMatch = await fetch(MATCH_DATA_URL)
        let matchData = await responseMatch.json()
        return matchData
    })
    
    const matchList = await Promise.all(matchPromisesList)
    return matchList
}

function matchBox (matchArr) {
    let classType;
    let matchResult;
    let personalKills = matchArr['kills']
    let personalDeaths = matchArr['deaths']
    let personalAssists = matchArr['assists']
    let personalKDA;
    personalDeaths === 0 ? personalKDA = personalKills + personalAssists : personalKDA = (personalKills + personalAssists) / personalDeaths
    if (matchArr['win']) {
        classType = 'match-won'
        matchResult = 'Victory'
    } else {
        classType = 'match-lost'
        matchResult = 'Defeat'
    }
    return `
    <div class="${classType} match-card">
    <div class="champion-info">
        <div class="champion-info-img"></div>
        <div class="game-result">${matchResult}</div>
    </div>

    <div class="result-info">
        <div class="result-info-score">${personalKills} / ${personalDeaths} / ${personalAssists}</div>
        <div class="result-info-kda">${Math.round(personalKDA * 10) / 10} KDA</div>
    </div>
    </div>
    `
    
}
function MatchCard(MatchDataList, playerID) {
    let MatchCardArr = MatchDataList.map((match) => {
        let MatchInfoObj = {}
        let idPosition = match.metadata.participants.indexOf(playerID, 0)

        if (idPosition > 4) {
            let winBoolean = match.info.teams[1].win
            MatchInfoObj.win = winBoolean
        } else {
            let winBoolean = match.info.teams[0].win
            MatchInfoObj.win = winBoolean
        }

        MatchInfoObj.kills = match.info.participants[idPosition]['kills']
        MatchInfoObj.deaths = match.info.participants[idPosition]['deaths']
        MatchInfoObj.assists = match.info.participants[idPosition]['assists']

        return MatchInfoObj
    })
    return MatchCardArr
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
            let MatchCardsList = MatchCard(MatchDataList, summonerPuuid)

            const matchContainerList = MatchCardsList.map((matchArr) => {
                return matchBox(matchArr)
            })
            matchesContainer.innerHTML = `
            ${matchContainerList.join("")}
            `
        })
    
    })
    
    
}

// function matchBox (result) {
//     let classType;
//     let InnerText;
//     if (result) {
//         classType = 'won'
//         InnerText = 'Victory'
//     } else {
//         classType = 'lost'
//         InnerText = 'Defeat'
//     }
//     return `<div class="${classType}">${InnerText}</div>`

// button.onclick = function () {
//     let summonerName = summonerNameInput.value

//     getSummonerData(summonerName).then((summonerPromise) => {
//         summonerData = summonerPromise
//         summonerPuuid = summonerData.puuid
        
//         getMatchDataList(summonerPuuid).then((MatchDataList) => {
            
//             winList = winList(MatchDataList, summonerPuuid)

//             const matchContainerList = winList.map((win) => {
//                 return matchBox(win)
//             })
//             matchesContainer.innerHTML = `
//             ${matchContainerList.join("")}
//             `
//         })
    
//     })
    
    
// }