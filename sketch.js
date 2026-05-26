let rainData = [];
let lastUpdate = "";
let isLoading = true;

// 原始 API 網址
const targetUrl = "https://wic.gov.taipei/OpenData/API/Rain/Get?stationNo=&loginId=open_rain&dataKey=85452C1D";
// 使用 allorigins 代理伺服器來解決 CORS 問題
const proxyUrl = "https://api.allorigins.win/raw?url=";

function setup() {
  createCanvas(windowWidth, windowHeight);
  fetchRainData();
  
  // 每 10 分鐘自動更新一次資料
  setInterval(fetchRainData, 10 * 60 * 1000);
}

function fetchRainData() {
  isLoading = true;
  // 組合代理伺服器與目標網址
  let finalUrl = proxyUrl + encodeURIComponent(targetUrl);
  
  // 使用 p5.js 的 loadJSON 取得資料
  loadJSON(finalUrl, gotData, handleError);
}

function gotData(data) {
  // 台北市雨量 API 回傳通常是一個陣列
  if (data && Array.isArray(data)) {
    rainData = data;
    lastUpdate = new Date().toLocaleTimeString();
  }
  isLoading = false;
}

function handleError(err) {
  console.error("抓取資料發生錯誤:", err);
  isLoading = false;
}

function draw() {
  background(30, 40, 60); // 深藍色背景
  
  fill(255);
  textSize(24);
  textAlign(LEFT, TOP);
  text("台北市即時雨量顯示 (API 介接)", 20, 20);
  
  textSize(14);
  fill(200);
  text("最後更新時間: " + (lastUpdate || "確認中..."), 20, 55);

  if (isLoading) {
    fill(255, 204, 0);
    text("資料讀取中...", 20, 90);
    return;
  }

  // 設定顯示區域
  let yPos = 100;
  let margin = 25;
  let xPos = 20;

  // 繪製表頭
  fill(100, 200, 255);
  text("測站名稱", xPos, yPos);
  text("行政區", xPos + 150, yPos);
  text("現在雨量 (mm)", xPos + 250, yPos);
  text("今日累積 (mm)", xPos + 380, yPos);
  
  stroke(100);
  line(20, yPos + 20, width - 20, yPos + 20);
  noStroke();

  // 顯示前 20 筆資料 (避免超出螢幕)
  fill(255);
  let displayCount = Math.min(rainData.length, floor((height - 150) / margin));
  
  for (let i = 0; i < displayCount; i++) {
    let station = rainData[i];
    let currentY = yPos + 35 + (i * margin);
    
    // 測站名稱與區域
    text(station.stationName || "未知", xPos, currentY);
    text(station.areaName || "-", xPos + 150, currentY);
    
    // 雨量數據 (根據數值改變顏色，提醒注意)
    let rainNow = float(station.rain1hr || 0);
    if (rainNow > 0) fill(100, 255, 100); 
    text(rainNow.toFixed(1), xPos + 250, currentY);
    
    fill(255);
    let rainDay = float(station.rain24hr || 0);
    text(rainDay.toFixed(1), xPos + 380, currentY);
  }
  
  if (rainData.length === 0) {
    text("目前無資料回傳", xPos, yPos + 35);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
function setup() {
  createCanvas(400, 400);
}

function draw() {
  background(220);
}
