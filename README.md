##12_3號  部屬了index檔以及brand_test檔案(brand test為個人品牌評鑑)
3/3 上傳了 Lab_recommendation以及大幅更改了career_fit的內容
3/12修正部分內容邏輯錯誤等bug，並且在career_fit的新增實務課群給大一至大二新生
3/23 全站 強制登入機制 (Auth Guard)： 實作全局路由守衛，未登入者將被強制踢回首頁並鎖定在登入 Modal，確保資料庫寫入正確。

index.html 新手分眾引導： 新增 Welcome Modal，首次登入自動詢問年級狀態並寫入 Firebase。

profile.html 技能庫 UX 優化： 將生硬的「技能標籤」改為「你擅長什麼？」點擊選擇UI，並支援匯出 GDPR 格式資料包。

career_fit.html 跨模組評分連動： 成功串接 Profile 技能數據，AI 履歷總分上限擴充至 250 分，並作為 AI 面試官的提問 Context。
