let rainData = [];
let lastUpdate = "";
let isLoading = true;

// 原始 API 網址
const targetUrl = "https://wic.gov.taipei/OpenData/API/Rain/Get?stationNo=&loginId=open_rain&dataKey=85452C1D";
// 使用 corsproxy.io 公共代理伺服器來解決 CORS 問題
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
  console.log("收到原始資料:", data);
  // 檢查資料結構：相容直接回傳陣列或包含在 Data 屬性中的情況
  let actualData = Array.isArray(data) ? data : (data.Data || data.data || []);
  
  if (Array.isArray(actualData) && actualData.length > 0) {
    rainData = actualData;
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
    // 相容 WIC API 可能使用的大寫開頭欄位
    let sName = station.StationName || station.stationName || "未知";
    let aName = station.AreaName || station.areaName || "-";
    text(sName, xPos, currentY);
    text(aName, xPos + 150, currentY);
    
    // 雨量數據 (根據數值改變顏色，提醒注意)
    let rainNow = float(station.Rain1hr || station.rain1hr || 0);
    if (rainNow > 0) fill(100, 255, 100); 
    text(rainNow.toFixed(1), xPos + 250, currentY);
    
    fill(255);
    let rainDay = float(station.Rain24hr || station.rain24hr || 0);
    text(rainDay.toFixed(1), xPos + 380, currentY);
  }
  
  if (rainData.length === 0) {
    text("目前無資料回傳", xPos, yPos + 35);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
