let rainData = [];
let lastUpdate = "";
let isLoading = true;

// 台北市主要測站經緯度座標對照表 (用於地圖定位)
const stationCoords = {
  "湖田國小": { lat: 25.1528, lon: 121.5323 },
  "大屯國小": { lat: 25.1741, lon: 121.4925 },
  "桃源國中": { lat: 25.1397, lon: 121.4914 },
  "北投國小": { lat: 25.1321, lon: 121.5005 },
  "陽明高中": { lat: 25.0945, lon: 121.5148 },
  "太平國小": { lat: 25.0610, lon: 121.5111 },
  "民生國中": { lat: 25.0602, lon: 121.5606 },
  "中正國中": { lat: 25.0336, lon: 121.5201 },
  "三興國小": { lat: 25.0303, lon: 121.5583 },
  "格致國中": { lat: 25.1362, lon: 121.5387 },
  "平等國小": { lat: 25.1278, lon: 121.5714 },
  "至善國中": { lat: 25.1014, lon: 121.5489 },
  "碧湖國小": { lat: 25.0811, lon: 121.5878 },
  "東湖國小": { lat: 25.0689, lon: 121.6169 },
  "瑠公國中": { lat: 25.0372, lon: 121.5847 },
  "舊莊國小": { lat: 25.0402, lon: 121.6186 },
  "博嘉國小": { lat: 25.0000, lon: 121.5886 },
  "北政國中": { lat: 24.9861, lon: 121.5786 },
  "長安國小": { lat: 25.0489, lon: 121.5283 },
  "萬華國中": { lat: 25.0278, lon: 121.4986 },
  "台灣大學(新)": { lat: 25.0175, lon: 121.5397 },
  "雙園": { lat: 25.0232, lon: 121.4925 },
  "中洲": { lat: 25.1235, lon: 121.4608 }
};

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

// 氣象署 CWA API 網址 (修正網域為 .gov.tw)
// 加上 &CountyName=%E8%87%BA%E5%8C%97%E5%B8%82 (臺北市) 並使用新的授權碼，確保讀取穩定
const targetUrl = "https://opendata.cwa.gov.tw/api/v1/rest/datastore/O-A0002-001?Authorization=CWA-F69579F0-802B-4B48-A431-FE9990299637&CountyName=%E8%87%BA%E5%8C%97%E5%B8%82";

// 改用 AllOrigins 的 get 模式（包裝模式），這對於解決 413 Payload Too Large 錯誤最有效
const proxyUrl = "https://api.allorigins.win/get?url=";

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
  // 必須使用 encodeURIComponent，否則 targetUrl 中的 &CountyName 會被代理伺服器誤以為是它自己的參數
  let finalUrl = proxyUrl + encodeURIComponent(targetUrl);
  
  // 使用 p5.js 的 loadJSON 取得資料
  loadJSON(finalUrl, gotData, handleError);
}

function gotData(data) {
  // 1. 處理 AllOrigins 的包裝結構
  let actualData;
  try {
    // AllOrigins 會把原始資料放在 contents 欄位（字串格式）
    actualData = JSON.parse(data.contents);
  } catch (e) {
    console.error("JSON 解析失敗，原始內容為:", data.contents);
    isLoading = false;
    return;
  }

  // 2. 解析氣象署資料結構
  if (actualData && actualData.records && actualData.records.Station) {
    let allStations = actualData.records.Station;
    // 精準過濾 CountyName 為 臺北市 的測站，同時確保有座標資料
    // 2. 排除沒有座標資料的站點
    rainData = allStations.filter(s => 
      s.GeoInfo && 
      (s.GeoInfo.CountyName === "臺北市" || s.GeoInfo.CountyName === "台北市")
      // 不再強制檢查 Coordinates，因為我們有 stationCoords 對照表
    );
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

  // 繪製表頭 (針對 CWA 欄位調整)
  fill(100, 200, 255);
  textSize(14);
  text("測站名稱", xPos, yPos);
  text("行政區", xPos + 120, yPos);
  text("1hr (mm)", xPos + 200, yPos);
  text("本日 (mm)", xPos + 280, yPos);
  
  stroke(100);
  line(20, yPos + 20, 350, yPos + 20);
  noStroke();

  // 顯示資料列表與在地圖上繪製點
  fill(255);
  let displayLimit = floor((height - 150) / margin);
  
  for (let i = 0; i < rainData.length; i++) {
    let station = rainData[i];
    
    // 1. 在列表顯示資料 (僅顯示前 N 筆以免超出螢幕)
    let sName = station.StationName || "未知";
    let aName = (station.GeoInfo && (station.GeoInfo.TownName || "-")) || "-";
    
    // 安全取得雨量資料，避免因欄位缺失導致程式崩潰
    let rainNow = (station.RainfallElement && station.RainfallElement.Past1hr) ? float(station.RainfallElement.Past1hr.Precipitation) : 0;
    let rainDay = (station.RainfallElement && station.RainfallElement.Now) ? float(station.RainfallElement.Now.Precipitation) : 0;
    
    // CWA 的 -99 或 -999 代表無資料，轉為 0 方便顯示
    if (rainNow < 0) rainNow = 0;
    if (rainDay < 0) rainDay = 0;

    if (i < displayLimit) {
      let currentY = yPos + 35 + (i * margin);
      fill(255);
      text(sName, xPos, currentY);
      text(aName, xPos + 120, currentY);
      if (rainNow > 0) fill(100, 255, 100); 
      text(rainNow.toFixed(1), xPos + 200, currentY);
      fill(255);
      text(rainDay.toFixed(1), xPos + 280, currentY);
    }

    // 2. 在地圖上繪製雨量點
    let lat = 0;
    let lon = 0;

    // 優先從對照表抓取座標，確保顯示在台北市範圍內
    if (stationCoords[sName]) {
      lat = stationCoords[sName].lat;
      lon = stationCoords[sName].lon;
    } else if (station.GeoInfo && Array.isArray(station.GeoInfo.Coordinates)) {
      // 如果對照表沒有，才從 API 資料尋找 WGS84 座標
      let c = station.GeoInfo.Coordinates.find(coord => coord.CoordinateName === "WGS84" || coord.CoordinateScale === "WGS84");
      lat = c ? float(c.StationLatitude) : 0;
      lon = c ? float(c.StationLongitude) : 0;
    }
    
    if (lat !== 0 && lon !== 0) {
      let pos = myMap.latLngToPixel(lat, lon);
      
      let radius = 12 + rainNow * 3;
      
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
    let sName = hoveredStation.StationName;
    let rNow = (hoveredStation.RainfallElement && hoveredStation.RainfallElement.Past1hr) ? hoveredStation.RainfallElement.Past1hr.Precipitation : 0;
    if (rNow < 0) rNow = 0;
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
