# 羅桂祥X現代：公民科學習平台（第一版・1A 樣板單元）

無後端的靜態網站（HTML、CSS、JavaScript），手機優先，免登入；學習紀錄存於瀏覽器（localStorage）。

## 檔案結構
```
index.html            頁面外殼（頂部校徽與現代標誌、底部導覽）
css/style.css         樣式
js/app.js             程式（不含課題內容）
data/curriculum.js    課程架構：3 個主題、10 個課題、29 個學習重點；七步流程名稱
data/1A.js            課題 1A 的全部內容（每個課題一個資料檔）
assets/               校徽、現代教育研究社標誌
```

## 七步流程（老師已確認）
1 想一想 → 2 學習目標 → 3 重要詞彙 → 4 重點精讀 → 5 圖解整理 → 6 小測站 → 7 答題訓練（課本題目、新擬題、重點溫習）
步驟名稱和次序在 `data/curriculum.js` 的 `CSD.steps` 修改。

## 新增課題
1. 複製 `data/1A.js` 為 `data/1B.js`，把 `id` 和各學習重點的 `code` 改為 1B、1B-1…
2. 在 `index.html` 底部加一行 `<script src="data/1B.js"></script>`。
主題學習區、概念庫、答題訓練營會自動收錄新課題。

## 審批
`data/1A.js` 內 `reviewed: false`。老師審批內容和新擬題目後改為 `true`，頁面上的「待老師審批」標示便會消失。

## 部署
把整個資料夾上載到 GitHub 儲存庫，在 Netlify 選「Import from Git」，Build command 留空，Publish directory 填 `/`（或 `.`）。
