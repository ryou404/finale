# 建立 Node.js 18 環境
FROM node:18-alpine

# 設定工作目錄
WORKDIR /app

# 先複製 package.json 並安裝依賴套件 (這樣可以利用快取加速部署)
COPY package*.json ./
RUN npm install

# 複製專案其餘的所有檔案
COPY . .

# 曝露應用程式的通訊埠
EXPOSE 3000

# 啟動伺服器
CMD ["npm", "start"]
