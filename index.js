const API_KEY = 'RGAPI-8ba30b91-c977-432a-9f89-c3dd83fa885f'

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
    let kills = matchArr['kills']
    let deaths = matchArr['deaths']
    let assists = matchArr['assists']
    let championName = matchArr['championName']
    let kda;
    deaths === 0 ? kda = kills + assists : kda = (kills + assists) / deaths
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
            <div class="champion-info-img" style="background-image: url(http://ddragon.leagueoflegends.com/cdn/12.3.1/img/champion/${championName}.png"></div>
            <div class="game-result">${matchResult}</div>
        </div>

        <div class="result-info">
            <div class="result-info-score">${kills} / ${deaths} / ${assists}</div>
            <div class="result-info-kda">${Math.round(kda * 10) / 10} KDA</div>
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
        MatchInfoObj.championName = match.info.participants[idPosition]['championName']

        return MatchInfoObj
    })
    return MatchCardArr
}

function averageKdaCalc(MatchCardsList) {
    const kdaArr = MatchCardsList.map((matchArr) => {
        if (matchArr.deaths === 0) {
            return (matchArr.kills + matchArr.assists)
        } else {
            return (matchArr.kills + matchArr.assists) / matchArr.deaths
        }
    })
    const kdaSum = kdaArr.reduce((previousVal, currentVal) => {
        return previousVal + currentVal
    })
    return (kdaSum / kdaArr.length)
}

function recentMatchContainerBox(MatchCardsList) {
    let averageKda = (Math.round(averageKdaCalc(MatchCardsList) * 10) / 10)
    return `<div class="average-kda">
                <span>Last 10 matches</span>
                <div>${averageKda} KDA</div>
            </div>
            <div class="average-kda-champions"></div>`
}

const button = document.getElementById('summoner-button')
const summonerNameInput = document.getElementById('summoner-input')
const matchesContainer = document.getElementById('match-container')
const recentMatchesContainer = document.getElementById('recent-matches-container')
let summonerData;


button.onclick = function () {
    let summonerName = summonerNameInput.value

    getSummonerData(summonerName).then((summonerPromise) => {
        summonerData = summonerPromise
        summonerPuuid = summonerData.puuid
        
        getMatchDataList(summonerPuuid).then((MatchDataList) => {
            let MatchCardsList = MatchCard(MatchDataList, summonerPuuid)

            recentMatchesContainer.innerHTML = recentMatchContainerBox(MatchCardsList)

            const matchContainerList = MatchCardsList.map((matchArr) => {
                return matchBox(matchArr)
            })
            matchesContainer.innerHTML = `
            ${matchContainerList.join("")}
            `

        })
    
    })
    
    
}
