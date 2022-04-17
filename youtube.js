const puppeteer = require("puppeteer");

//npm install pdfkit
const pdf = require('pdfkit');
const fs = require('fs');

//current tab
let cTab;

//youbtube playlist link
let link = "https://www.youtube.com/playlist?list=PLW-S5oymMexXTgRyT3BWVt_y608nt85Uj";


//IIFE - Immediately initialised function expression
(async function(){
    try{
        //puppeteer ko launch krna hai
        let browserOpen = puppeteer.launch({
            headless:false,
            defaultViewport:null,
            args:['--start-maximized']
        })

        let browserInstance = await browserOpen
        //for opening multiple tabs
        let alltabsArr = await browserInstance.pages()
        cTab = alltabsArr[0]
        //STEP 1- direct to the youtube playlist
        await cTab.goto(link)
        // await cTab.waitForSelector("yt-simple-endpoint.style-scope.yt-formatted-string")        
        await cTab.waitForSelector('h1#title')

        let name = await cTab.evaluate(function(select){return document.querySelector(select).innerText}, 'h1#title');
        console.log(name);


        // data of the songs
        let allData = await cTab.evaluate(getData , '#stats .style-scope.ytd-playlist-sidebar-primary-info-renderer')
        console.log(allData.noOfVideos, allData.noOfViews)


        let totalVideos = allData.noOfVideos.split(" ")[0]
        console.log(totalVideos)

        //videos of the current view page
        let currentVideos = await getcvideosLength()
        console.log(currentVideos);  
        
        
    while(totalVideos - currentVideos >= 10){
        await scrollToBottom()

        currentVideos = await getcvideosLength()

    }


    let songList = await getStats()
    console.log(songList)
    // songList.then(function (result){
    //     console.log(result)
    // })

    // pipe - pathway bana deta hai pdf file bnane k liye
    let pdfDoc = new pdf
    pdfDoc.pipe(fs.createWriteStream('bestSongs.pdf'))
    pdfDoc.text(JSON.stringify(songList))
    pdfDoc.end()
       
    }catch(error){
        console.log(error)

    }
})()

//data of the playlist
async function getData(selector){
    let allElements = document.querySelectorAll(selector)
    let noOfVideos = allElements[0].innerText
    let noOfViews = allElements[1].innerText

    return{
        noOfVideos,
        noOfViews
    }
}


// length of videos in current page
async function getcvideosLength(){
    let length = await cTab.evaluate(getLength, '#container>#thumbnail span.style-scope.ytd-thumbnail-overlay-time-status-renderer')
    return length
}

async function getLength(durationSelector){
    let durationElement = document.querySelectorAll(durationSelector)
    return durationElement.length
}



// scrolling down function
async function scrollToBottom(){
    await cTab.evaluate(goToBottom)

    function goToBottom(){
        window.scrollBy(0, window.innerHeight)
    }

}

//get all the details
async function getStats(){
    let list = cTab.evaluate(getNameAndDuration, '#video-title', '#container>#thumbnail span.style-scope.ytd-thumbnail-overlay-time-status-renderer')
    return list
}

//get Name and duration 
async function getNameAndDuration(videoSelector, durationSelector){
    let videoElement = document.querySelectorAll(videoSelector)

    let durationElement = document.querySelectorAll(durationSelector)

    let currentList = []

    for(let i =0; i<durationElement.length; i++){
        let videoTitle = videoElement[i].innerText
        let videoDuration = durationElement[i].innerText

        currentList.push({videoTitle, videoDuration})
    }

    return currentList; 

}

