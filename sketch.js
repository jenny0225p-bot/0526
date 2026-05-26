let rainData = [];
let lastUpdate = "";
let isLoading = true;

// Mappa 地圖變數
let myMap;
let canvas;
const mappa = new Mappa('Leaflet');

// 地圖初始設定（以台北車站為中心）
const options = {
  lat: 25.0478,
  lng: 121.5170,
  zoom: 12,
  style: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
};

// 原始 API 網址
const targetUrl = "https://wic.gov.taipei/OpenData/API/Rain/Get?stationNo=&loginId=open_rain&dataKey=85452C1D";
// 使用 corsproxy.io 公共代理伺服器來解決 CORS 問題
const proxyUrl = "https://api.allorigins.win/raw?url=";

function setup() {
  canvas = createCanvas(windowWidth, windowHeight);
  // 初始化地圖並將其疊加在畫布上
  myMap = mappa.tileMap(options);
  myMap.overlay(canvas);

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
  // 必須使用 clear() 才能看到地圖層
  clear();
  
  // 繪製半透明半遮罩背景，讓文字更易讀
  fill(30, 40, 60, 180);
  noStroke();
  rect(10, 10, 520, height - 20, 10);

  fill(255);
  textSize(24);
  textAlign(LEFT, TOP);
  text("台北市即時雨量顯示 (API 介接)", 20, 20);
  
  textSize(14);
  fill(200);
  text("最後更新時間: " + (lastUpdate || "確認中..."), 20, 55);

  if (isLoading) {
    fill(255, 204, 0);
    text("API 資料讀取中...", 20, 90);
    return;
  }

  // 設定顯示區域
  let yPos = 100;
  let margin = 25;
  let xPos = 20;
  let hoveredStation = null;

  // 繪製表頭
  fill(100, 200, 255);
  textSize(14);
  text("測站名稱", xPos, yPos);
  text("行政區", xPos + 110, yPos);
  text("現在 (mm)", xPos + 200, yPos);
  text("累積 (mm)", xPos + 280, yPos);
  
  stroke(100);
  line(20, yPos + 20, 350, yPos + 20);
  noStroke();

  // 顯示資料列表與在地圖上繪製點
  fill(255);
  let displayLimit = floor((height - 150) / margin);
  
  for (let i = 0; i < rainData.length; i++) {
    let station = rainData[i];
    
    // 1. 在列表顯示資料 (僅顯示前 N 筆以免超出螢幕)
    if (i < displayLimit) {
      let currentY = yPos + 35 + (i * margin);
      let sName = station.StationName || station.stationName || "未知";
      let aName = station.AreaName || station.areaName || "-";
      fill(255);
      text(sName, xPos, currentY);
      text(aName, xPos + 110, currentY);
      
      let rainNow = float(station.Rain1hr || station.rain1hr || 0);
      if (rainNow > 0) fill(100, 255, 100); 
      text(rainNow.toFixed(1), xPos + 200, currentY);
      
      fill(255);
      let rainDay = float(station.Rain24hr || station.rain24hr || 0);
      text(rainDay.toFixed(1), xPos + 280, currentY);
    }

    // 2. 在地圖上繪製雨量點
    let lat = float(station.Lat || station.lat);
    let lon = float(station.Lon || station.lon || station.Lng || station.lng);
    
    if (lat && lon) {
      let pos = myMap.latLngToPixel(lat, lon);
      let rNow = float(station.Rain1hr || station.rain1hr || 0);
      let radius = 10 + rNow * 2;
      
      // 偵測滑鼠是否在圓點上
      let d = dist(mouseX, mouseY, pos.x, pos.y);
      if (d < radius / 2 + 5) {
        hoveredStation = station;
        fill(255, 255, 0); // 懸停時變黃色
      } else {
        fill(255, 50, 50, 180); // 平時為紅色半透明
      }
      
      noStroke();
      ellipse(pos.x, pos.y, radius, radius);
    }
  }

  // 3. 顯示懸停資訊視窗 (Tooltips)
  if (hoveredStation) {
    let sName = hoveredStation.StationName || hoveredStation.stationName;
    let rNow = hoveredStation.Rain1hr || hoveredStation.rain1hr;
    fill(0, 0, 0, 200);
    rect(mouseX + 15, mouseY - 40, 140, 50, 5);
    fill(255);
    textSize(14);
    text(`${sName}\n雨量: ${rNow} mm`, mouseX + 25, mouseY - 30);
  }
  
  if (rainData.length === 0) {
    text("目前無資料回傳", xPos, yPos + 35);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
