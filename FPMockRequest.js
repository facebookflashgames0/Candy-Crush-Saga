let loadedLevels = {}
let gameModesPerLevel = []

function decodeParams(params) {
    let decoded={}
    for (let param of decodeURIComponent(params).split("&").map((param)=>param.split('='))) {
        decoded[param[0]]=param[1]
    }
    return decoded
}

function set(key, obj) {
    localStorage.setItem(key, JSON.stringify(obj))
}

function get(key) {
    return JSON.parse(localStorage.getItem(key))
}

/*
I don't believe the "type" name matters too much for this specifically
[
{
"typeId": "1234",
"amount": 1234,
"type": "CandyColorBomb",
"category": "candyBooster", (or "candyCharm" or "candyCurrency")
}
]
*/

function addBoosters(boosters, unlock) {

    //console.log(boosters)
    let data = getBoosters(true)
    //console.log(boosters, unlock)
    for (let booster of boosters) {
        //console.log(booster.type, booster.amount)
        // list of boosters you're "allowed" to add
        //console.log(`checking booster ${booster.type} allowd to be added`)
        //if (window.AllowedBoosters.includes(booster.type)) {
            //console.log(` booster ${booster.type} is allowed to be added`)
            //console.log(booster.type)

            let boosterTypeId = window.boosterIdentifiers[booster.type]
            if (boosterTypeId && boosterTypeId!==3280) {
                let existingBooster = data.find((invbooster)=>invbooster.type == booster.type)
                let unlockThis = unlock || !window.UnlockBoosters.includes(booster.type)
                if (!existingBooster) {
                    //console.log('adding new booster')
                    existingBooster = {
                        type: booster.type,
                        category:"candyBooster",
                        typeId: parseInt(boosterTypeId),
                        amount: 0,
                        availability: 2,
                        leaseStatus: 0
                    }

                    if (booster.type.includes("Charm")) {
                        existingBooster.category = "candyCharm"
                    }

                    data.push(existingBooster)
                }
                //console.log('adding booster')
                existingBooster.amount+=booster.amount
                
                if (existingBooster.amount < 0) {
                    existingBooster.amount = 0
                }

                if (unlockThis) {
                    //console.log('unlocking booster')
                    existingBooster.unlocked = true
                }
            }
        //}
    }
    set('boosters', data)
    return data.filter((booster)=>booster.unlocked)
}

function removeBoosters(boosters) {
    for (let booster of boosters) {
        booster.amount *= -1
    }
    //console.log('removing', boosters)
    return addBoosters(boosters)
}

function getBoosters(includeLocked) {
    let data = get('boosters')
    if (!data) {
        data = []
        set('boosters', data)
    }
    if (!includeLocked) {
        data = data.filter((booster)=>booster.unlocked)
    }
    return data.sort(function (a,b){
        let atype = a.typeId
        let btype = b.typeId

        if (a.category === "candyCharm") {
            atype+=10000
        }
        if (b.category === "candyCharm") {
            btype+=10000
        }
        return btype-atype
    })


}

// gold needs to be concatenated here
function getBalance() {
    let currentUser = getCurrentUser()
    return getBoosters(false).concat([{"typeId":3280,"type":"CandyHardCurrency","category":"candyCurrency","amount":currentUser.gold,"availability":0,"leaseStatus":0}])
}

/*
  "currentUser": {
    "userId": "937",
    "lives": 5,
    "timeToNextRegeneration": -1,
    "gold": 0,
    "unlockedBoosters": [
    ],
    "soundFx": true,
    "soundMusic": true,
    "maxLives": 5,
    "immortal": true,
    "mobileConnected": false,
    "currency": "CAD",
    "altCurrency": "KHC",
    "preAuth": false,
    "boosterInventory": {
    }
  },
*/

function getCurrentUser() {
    //set currentuser data if its not already set
    let data = get('currentUser')
    if (!data) {
        data = {
            lives: 5,
            maxLives: 5,
            timeToNextRegeneration: -1000,
            timeStampLastLivesCheck: -1,
            gold: 0,
            soundFx: true,
            soundMusic: true
        }
        set('currentUser', data)
    }

    calcLives(data)

    return {
        userId: "937",
        lives: data.lives,
        timeToNextRegeneration: Math.floor(data.timeToNextRegeneration/1000),
        maxLives: data.maxLives,
        gold: data.gold,
        unlockedBoosters: getBoosters(false).map((booster)=>parseInt(booster.typeId)),
        soundFx: data.soundFx,
        soundMusic: data.soundMusic,
        immortal: false,
        mobileConnected: false,
        currency: "CAD",
        altCurrency: "KHC",
        preAuth: false,
        boosterInventory: {}
    }
}

function calcLives(data) {
    let now = Date.now()
    if (data.lives < data.maxLives) {
        // see how long it was since the last check, and compare with the 
        // time until a life regenerates
        let long = now - data.timeStampLastLivesCheck
        let addLife = data.timeToNextRegeneration - long
        if (addLife > 0) {
            // if its not yet just update the timestamp
            data.timeToNextRegeneration = data.timeToNextRegeneration - long
        } else {
            // otherwise see how many lives need to be added
            addLife = -addLife;
            data.lives += 1
            data.lives += Math.floor(addLife/1800000);
            data.timeToNextRegeneration = 1800000 - (addLife % 1800000);
        }
    }

    data.timeStampLastLivesCheck = now

    data.lives = Math.max(Math.min(data.lives, data.maxLives), 0)
    if (data.lives == data.maxLives) {
        data.timeToNextRegeneration = -1000
    }
    set('currentUser', data)
}

// I cba to check if it's the **NEXT** day, I'll just check if it's a DIFFERENT day than before.
window.isWheelActive = function() {
    let data = get('wheelData')
    if (!data) {
        return true
    }
    let currentDate = new Date()
    return (data.lastDay != currentDate.getDate() || data.lastMonth != currentDate.getMonth() || data.lastYear != currentDate.getFullYear())
}

let wheelPrizes = [
    "CandyHammer",
    "CandyColorBomb",
    "CandySwedishFish",
    "CandyStripedWrapped",
    "CandyJoker",
    "CandyCoconutLiquorice",
    "CandyFreeSwitch"
]
// 1/100
let JackpotChance = 100
let JackpotItem = "CandyWheelOfBoosterJackpot"

function getWheelPrize() {
    if (window.isWheelActive()) {
        let date = new Date()
        let data = {
            lastDay: date.getDate(),
            lastMonth: date.getMonth(),
            lastYear: date.getFullYear()
        }
        set('wheelData', data)
        let random = Math.floor(Math.random() * JackpotChance) + 1
        let prize = wheelPrizes[Math.floor(Math.random() * wheelPrizes.length)]
        if (random !== 1) {
            //console.log('wheel prize today is ' + prize)
            addBoosters([{type: prize, amount:1}])
            return prize
        } else {
            //console.log('wheel prize today is JACKPOT')
            addBoosters(wheelPrizes.map((booster)=>({type:booster, amount:3})))
            return JackpotItem
        }
    }
    return ""
}

function getUserUniverse() {
    let data = get('userUniverse')
    if (!data) {
        data = {
            "episodes": [
              {
                "id": 1,
                "levels": [
                  {
                    "id": 1,
                    "episodeId": 1,
                    "score": 0,
                    "stars": 0,
                    "unlocked": true,
                    "completedAt": -1,
                    "unlockConditionDataList": []
                  }
                ]
              },
              {
                "id": 1201,
                "levels": [
                  {
                    "id": 1,
                    "episodeId": 1201,
                    "score": 0,
                    "stars": 0,
                    "unlocked": true,
                    "completedAt": -1,
                    "unlockConditionDataList": []
                  }
                ]
              }
            ],
            "unlockedItems": []
          }
        set('userUniverse', data)
    }

    data.episodes.sort(function(a,b) {return a.id - b.id})
    return data
}

function gameStart(episode, level) {
    // this is to make lives go down by 1
    let data = get('currentUser')
    calcLives(data)
    data.lives--
    if (data.timeToNextRegeneration == -1000) {
        data.timeToNextRegeneration = 1800000
        data.timeStampLastLivesCheck = Date.now()
    }
    calcLives(data)

    let res = {
        currentUser: getCurrentUser(),
        recommendedSeeds: [],
        levelData: loadedLevels[episode][level].gameData//loadedLevels.find((levelData) => levelData.level == level && levelData.episode == episode).gameData
    }
    return res
}

/*
endData "{"movesLeft":0,"movesInit":6,"movesMade":6,"seed":1736737840323,"score":780,"timeLeftPercent":-1,"reason":0,"episodeId":1,"cs":"1f21e0","levelId":1,"variant":0}"

{
  "bestResult": false,
  "newStarLevel": false,
  "episodeId": 1,
  "levelId": 1,
  "score": 600,
  "stars": 3,
  "events": [],
  "levelToplist": {
    "episodeId": 1,
    "levelId": 1,
    "toplist": [
    ]
  },
  "userUniverse": {
  },
  "currentUser": {

  }
}
*/

function getToplist(episode, level) {
    let toplist = []
    let universe = getUserUniverse()
    let UniverseEpisode = universe.episodes.find((universeepisode)=>universeepisode.id == episode)
    if (UniverseEpisode) {
        let UniverseLevel = UniverseEpisode.levels.find((universelevel)=>universelevel.id == level)
        if (UniverseLevel?.score) {
            toplist.push({
                userId: 937,
                value: UniverseLevel.score
            })
        }
    }
    return {episodeId: episode, levelId: level, toplist}
}

function gameEnd(endData) {
    //console.log(endData)
    let res = {
        bestResult: false,
        newStarLevel: false,
        episodeId: endData.episodeId,
        levelId: endData.levelId,
        score: endData.score,
        stars: 0,
        events: []
    }
    let currentUser = getCurrentUser()
    res.currentUser = currentUser

    let userUniverse = getUserUniverse()
    res.userUniverse = userUniverse

    if (endData.reason === 0) {
        //reason 0 means they have won
        
        // get stars
        let level = JSON.parse(loadedLevels[endData.episodeId][endData.levelId].gameData)
        res.stars = 0
        for (let scoreTarget of level.scoreTargets) {
            if (endData.score>=scoreTarget) {
                res.stars = level.scoreTargets.indexOf(scoreTarget)+1
            }
        }

        let episode = userUniverse.episodes.find((episode)=> episode.id == endData.episodeId)
        let levelScore = episode?.levels.find((levelentry)=> levelentry.id == endData.levelId)

        
        if (res.score > (levelScore?.score || 0) && res.stars >= (levelScore?.stars || 0)) {
            res.bestResult = true
            levelScore.score = res.score
        }

        // unlocking new levels
        let episodeCompleted = false
        let newLevelCompleted = false
        let nextLevelId;
        let nextEpisodeId;
        if (res.stars > (levelScore?.stars || 0)) {
            res.newStarLevel = true


            if (!levelScore?.stars) {
                let levelId = res.levelId + 1
                let episodeId = res.episodeId
                if (episodeId > 1200) {
                    if (episodeId <= 1202 && levelId > 10) {
                        episodeId++;
                        levelId = 1;
                        episodeCompleted = true
                    }
                    if (episodeId > 1202 && levelId > 15) {
                        episodeId++;
                        levelId = 1;
                        episodeCompleted = true
                    }
                } else {
                    if (episodeId <= 2 && levelId > 10) {
                        episodeId++;
                        levelId = 1;
                        episodeCompleted = true
                    }
                    if (episodeId > 2 && levelId > 15) {
                        episodeId++;
                        levelId = 1;
                        episodeCompleted = true
                    }
                }
                newLevelCompleted = true
                nextEpisodeId = episodeId
                nextLevelId = levelId
                res.events.push({type:"LEVEL_COMPLETED", data: JSON.stringify({episodeId: res.episodeId, levelId: res.levelId})})
                //gameEnd.events.push({type:"LEVEL_UNLOCKED", data: JSON.stringify({episodeId, levelId})})
            }

            levelScore.stars = res.stars
        }

        // this entire section only ever happens if the level was completed for the first time
        let doUnlockNextLevel = false
        // this just makes the popup appear
        if (episodeCompleted) {
            res.events.push({type:"EPISODE_COMPLETED", data: JSON.stringify({episodeId: res.episodeId})})
            // but do we unlock the next level..
            // skip the social block gates, but dreamworld
            // is only unlocked if the corresponding reality episode is cleared

            //this could cause issues with episodes 1 and 2 only having 10 levels, but the mode is only unlocked after level 50 anyways, so it's not a big deal.
            if (res.episodeId < 1200) {
                doUnlockNextLevel = true
                res.events.push({type:"EPISODE_UNLOCKED", data: JSON.stringify({episodeId: nextEpisodeId})})

                //get dreamworld episode corresponding to the PREVIOUS one
                let DWUniverseEpisode = userUniverse.episodes.find((universeepisode)=>universeepisode.id == res.episodeId+1199)
                let DWUniverseLevel = DWUniverseEpisode?.levels.find((universelevel)=>universelevel.id == 15)
                //console.log(DWUniverseEpisode)
                // if level 15 is cleared
                if (DWUniverseEpisode && DWUniverseLevel?.stars > 0) {
                    //console.log('unlocking dreamworld episode after clearing reality episode')
                    if (!userUniverse.episodes.find((universeepisode)=>universeepisode.id == res.episodeId+1200)) {
                        // we add the level to the array as well, as this is a different episode being unlocked lol
                        userUniverse.episodes.push({
                            id: res.episodeId+1200,
                            levels:[{
                                "id": 1,
                                "episodeId": res.episodeId+1200,
                                "score": 0,
                                "stars": 0,
                                "unlocked": true,
                                "completedAt": -1,
                                "unlockConditionDataList": []
                              }]
                        })
                        res.events.push({type:"EPISODE_UNLOCKED", data: JSON.stringify({episodeId: res.episodeId+1200})})
                        res.events.push({type:"LEVEL_UNLOCKED", data: JSON.stringify({episodeId: res.episodeId+1200, levelId: 1})})
                    }
                } else {
                    //console.log('not unlocking dreamworld episode - the dreamworld episode before it is not yet completed.')
                }
            } else {
                // look for reality episode unlocked that is the two episodes ahead 
                //console.log(nextEpisodeId)
                let RealityUniverseEpisode = userUniverse.episodes.find((universeepisode)=>universeepisode.id+1199 == nextEpisodeId)
                //console.log(RealityUniverseEpisode)
                if (RealityUniverseEpisode) {
                    //console.log('unlocking dreamworld episode after clearing dreamworld episode')
                    res.events.push({type:"EPISODE_UNLOCKED", data: JSON.stringify({episodeId: nextEpisodeId})})
                    doUnlockNextLevel = true
                } else {
                    //console.log('not unlocking next dreamworld episode after clearing the previous - the relevant reality episode is NOT completed.')
                }
            }
        } else if (newLevelCompleted) {
            doUnlockNextLevel = true
        }

        //console.log(`dounlocknextlevel`,doUnlockNextLevel)
        if (doUnlockNextLevel) {
            res.events.push({type:"LEVEL_UNLOCKED", data: JSON.stringify({episodeId: nextEpisodeId, levelId: nextLevelId})})
            let universeEpisode = userUniverse.episodes.find((episode)=>episode.id==nextEpisodeId)
            if (!universeEpisode) {
                universeEpisode = {
                    id: nextEpisodeId,
                    levels:[]
                }
                userUniverse.episodes.push(universeEpisode)
            }
            universeEpisode.levels.push({
                id: nextLevelId,
                episodeId: nextEpisodeId,
                score:0,
                stars:0,
                unlocked:true,
                completedAt:-1,
                unlockConditionDataList:[]
            })
        }

        /*
        // this is just to unlock the charm
        // maybe enable it in the swf so the game realizes sooner
        console.log(res.episodeId, res.levelId)
        if (res.episodeId == 2 && res.levelId == 9) {
            console.log('unlocking charm')
            if (!getBoosters(true).find((booster)=>booster.type=="CandyCharmOfFrozenTime"))
                addBoosters([{type:"CandyCharmOfFrozenTime", amount:1}], true)
        }
        */

        // give life back
        let tempUser = get('currentUser')
        tempUser.lives++
        calcLives(tempUser)
        currentUser = getCurrentUser()
    }
    res.levelToplist= getToplist(endData.episodeId, endData.levelId)
    set('userUniverse',userUniverse)
    return res
}

// later, the archived strings from other languages can be used in the resources but currently
// I just want to get the game to RUN.
function gameInitLight() {
    let currentUser = getCurrentUser()
    let resources = gameInitStrings
    let itemBalance = getBalance()
    let userUniverse = getUserUniverse()
    
    // this could change in the future..
    let language = 'en'

    return {
        currentUser,
        resources,
        properties: {
            "ad_video_activated": "false",
            "cutscene_episode_6": "bunny",
            "cutscene_episode_5": "unicorn",
            "cutscene_episode_4": "yeti",
            "cutscene_episode_3": "dragon",
            "cutscene_episode_2": "robot",
            "cutscene_episode_1": "girl"
        },
        itemBalance,
        recipes:[],
        userProfiles: [
            {
                "userId": 937,
                "externalUserId": "937",
                "lastOnlineTime": 1736338198000,
                "fullName": "You",
                "name": "You",
                "pic": "http://candycrush.king.com/odus100x100.png",
                "picSquare": "http://candycrush.king.com/odus50x50.png",
                "countryCode": "CA",
                "topEpisode": 1,
                "topLevel": 1,
                "totalStars": 0,
                "lastLevelCompletedAt": 0,
                "lastLevelCompletedEpisodeId": 0,
                "lastLevelCompletedLevelId": 0,
                "friendType": "NONE"
            }
        ],
        userUniverse,
        events: [],
        adsEnabled: false,
        daysSinceInstall: 0,
        language,
        availableBoosters: []
    }
}

function getCandyProperties() {
    let data = get('candyProperties')
    if (!data) {
        data = {

        }
        set('candyProperties', data)
    }
    return data
}

function setCandyProperty(key, value) {
    let data = getCandyProperties()
    data[key] = value
    set('candyProperties', data)
}


window.MockRequest = function(url, params) {
    url = url.split('?')[0] // candycrushapi gives the query string differently sadly
    // but we can just ignore it

    // decode the uri components for everything else
    let decoded = decodeParams(params)
    //console.log(decodedParams)
    //console.log(url, decoded)
    let result = {}
    try {
        switch (url) {
            case "http://candycrush.king.com/api/gameInitLight": {
                result = gameInitLight()
                break;
            } case "http://candycrush.king.com/api/handOutItemWinnings": {
                //console.log('adding this')
                let boostersAdd = JSON.parse(decoded['arg0'])
                //console.log(boostersAdd)
                addBoosters(boostersAdd)
                result = getBalance()
                break
            } 
            case "http://candycrush.king.com/api/useItemsInGame": {
                //console.log('adding this')
                let boostersAdd = JSON.parse(decoded['arg0'])
                //console.log(boostersAdd)
                removeBoosters(boostersAdd)
                result = getBalance()
                break
            }
            case "http://candycrush.king.com/api/gameStart2": {
                result = gameStart(decoded['arg0'], decoded['arg1'])
                break
            }
            case "http://candycrush.king.com/api/getLevelToplist": {
                result = getToplist(decoded['arg0'], decoded['arg1'])
                break;
            }
            case "http://candycrush.king.com/api/gameEnd3": {
                result = gameEnd(JSON.parse(decoded['arg0']))
                break
            }
            case "http://candycrush.king.com/api/poll": {
                result = {currentUser: getCurrentUser()}
                break;
            }
            case "http://candycrush.king.com/api/getMessages": {
                result = {events: [], currentUser: getCurrentUser()}
                break;
            }
            case "http://candycrush.king.com/api/getBalance": {
                result = getBalance()
                break;
            }
            case "http://candycrush.king.com/api/unlockItem": {
                result = addBoosters([{type:decoded['arg0'], amount:0}], true)
                break
            }
            case "http://candycrush.king.com/candycrushapi/getWebFileUrl": {
                let wfu = decoded['arg0']
                switch (wfu) {
                    case "/s.json":
                        result = "/sales.json"
                        break
                    case "/hl.json":
                        result = "/hardlevels.json"
                        break
                    case "/lo.json":
                        result = "/liveops.json"
                        break
                }
                break
            }
            case "http://candycrush.king.com/candycrushapi/getGameModes": {
                result = ["Classic", "Classic moves", "Drop down", "Light up", "Order", "Frogger", "Jelly Drop down", "Jelly Order", "Order Drop", "Jelly Color", "Jelly Time"]
                break
            }
            case "http://candycrush.king.com/candycrushapi/getGameModePerLevel": {
                result = gameModesPerLevel
                break
            }
            case "http://candycrush.king.com/candycrushapi/getCandyProperties": {
                result = {candyProperties: getCandyProperties()}
                break
            }
            case "http://candycrush.king.com/candycrushapi/getLevelAbTests": {
                result = []
                break
            }
            case "http://candycrush.king.com/candycrushapi/setCandyProperty": {
                setCandyProperty(decoded['arg0'],decoded['arg1'])
                break
            }
            case "http://candycrush.king.com/candycrushapi/deliverInitialHardCurrencyGiftForIntroPop": {
                let currentUser = get('currentUser')
                setCandyProperty('introduceHardCurrency', 'true')
                if (!currentUser.hasGottenInitialGift) {
                    currentUser.gold += 50
                    currentUser.hasGottenInitialGift = true
                }
                set('currentUser',currentUser)
            }
            case "http://candycrush.king.com/candycrushapi/getWheelOfBoosterPrize": {
                result = getWheelPrize()
                break
            }
            case "http://candycrush.king.com/api/setSoundFx": {
                let currentUser = get('currentUser')
                currentUser.soundFx = JSON.parse(decoded['arg0'])
                set('currentUser', currentUser)
                break
            }
            case "http://candycrush.king.com/api/setSoundMusic": {
                let currentUser = get('currentUser')
                currentUser.soundMusic = JSON.parse(decoded['arg0'])
                set('currentUser', currentUser)
                break
            }
            default: {
                //console.log(url, decoded)
            }
        }
    } catch (err) {
        console.error(err)
    }
    //console.log(result)
    return JSON.stringify(result)
}


function getProductPackages() {
    let res = [

    ]
    for (let product of window.PackagePrice) {
        let package = {
            "type": parseInt(product.productId),
            "products": [

            ],
            "prices":[{"cents":0,currency:"CAD"},{"cents":product.price * 100,currency:"KHC"}],
            "listPrices":[{"cents":0,currency:"CAD"},{"cents":product.price * 100,currency:"KHC"}],
        }
        for (let item of product.items) {
            let packageProduct = {
                "itemType": parseInt(item.itemId),
                "prices":[{"cents":0,currency:"CAD"},{"cents":product.price * 100,currency:"KHC"}],
                "listPrices":[{"cents":0,currency:"CAD"},{"cents":product.price * 100,currency:"KHC"}],
                "discountFactorPercent": 100
            }

            if (item.deliverItemId == "3280") {
                packageProduct.deliverData = JSON.stringify({
                    "amount": item.deliverKHCAmount,
                    "currency": "KHC"
                })
                package.listPrices[0].cents = 0
            } else if (item.deliverItemId) {
                packageProduct.deliverData = JSON.stringify({
                    "amount":item.amount,
                    "itemType":{
                        "id": parseInt(item.deliverItemId),
                        "name":item.deliverItemType,
                        "shortName":item.deliverItemType,
                        "description":"",
                        "category":"candyBooster",
                        "itemTypeFamily":"None"
                    }
                })
            }
            //if (item.deliverData) {
            //    packageProduct.deliverData - item.deliverData
            //}
            package.products.push(packageProduct)
        }
        res.push(package)
    }
    return res
}

function handlePurchase(purchaseParams, isGoldPurchase) {
    //console.log(purchaseParams)
    let PackageId = purchaseParams.orderItems[0]?.productPackageType
    let Package = window.PackagePrice.find((package)=>package.productId == PackageId)
    //console.log(Package)

    let currentUser = get('currentUser')
    if (isGoldPurchase || currentUser.gold >= Package.price) {
        if (!isGoldPurchase) {
            //console.log('removing gold...')
            currentUser.gold -= Package.price
        }
        //console.log('adding boosters', Package.items.map((booster)=>({amount: booster.amount, type: booster.deliverItemType})))
        addBoosters(Package.items.map((booster)=>({amount: booster.amount, type: booster.deliverItemType})), false)

        // for the special item types
        for (let item of Package.items) {
            switch (item.deliverItemType || item.itemType) {
                case "CandyFullLife": {
                    //console.log('refilling lives')
                    currentUser.lives = currentUser.maxLives
                    calcLives(currentUser)
                    break
                }
                case "CandyHardCurrency": {
                    //console.log('adding gold from itemDeliverKHCAmount')
                    currentUser.gold += item.deliverKHCAmount
                }
            }
        }

        set('currentUser', currentUser)
        //console.log('done purchase')
        return {
            status: "ok",
            error: "",
            transactionId: "example",
            isPurchaseForAnotherUser: false
        }
    }
    return {
        status: "error",
        error: "ur too broke lol",
        transactionId: "example",
        isPurchaseForAnotherUser: false
    }
}

//game.externalInterfaceRpcReceive
//ExternalInterfaceRpc.receive
window.ExternalInterfaceRpc = {
    receive: function(rpc) {
        //console.log(rpc.method)
        result = []
        switch (rpc.method) {
            case "ProductApi.getUserCurrency": {
                result = "CAD"
                break;
            }
            case "ProductApi.getAllProductPackages": {
                result = getProductPackages()
                break
            }
            case "ProductJsApi.getPurchaseOutcomesToDisplay": {
                result = []
                break
            }
            case "ProductApi.purchase": {
                result = handlePurchase(rpc.params[0])
                break
            }
            case "ProductJsApi.buy2": {
                result = handlePurchase(rpc.params[0], true)
                break;
            }
            default: {
                console.warn(`unknown method ${rpc.method}`, rpc.params)
                break
            }
        }

        setTimeout(()=>{
            try {
                //console.log(result)
                game.externalInterfaceRpcReceive({
                        id: rpc.id,
                        result: result
                })
            } catch (err) {
                //console.error(err)
            }
        },250)
    }
}


// load levels
fetch('/resources/game-configuration.json').then(res=>res.json().then((levels)=>{
    loadedLevels = {
    }
    for (let level of levels) {
        if (!loadedLevels[level.episode]) {
            loadedLevels[level.episode] = {}
        }
        loadedLevels[level.episode][level.level] = level
    }
    console.log('loaded levels!')
}))

fetch('/candycrushapi/getGameModePerLevel').then(res=>res.json().then((json)=>{
    gameModesPerLevel = json
    console.log('loaded game modes per level')
}))