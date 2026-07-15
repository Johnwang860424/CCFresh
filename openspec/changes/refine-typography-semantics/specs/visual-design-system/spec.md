# visual-design-system

## MODIFIED Requirements

### Requirement: 強調色語意分工
互動元素（stepper +、active tab、價格、結帳送出、查訂單等一般 CTA）SHALL 使用品牌藍系 token；「加入購物車」按鈕 SHALL 使用促銷橘 token（`bg-promo`，hover `promo-bright`）；促銷徽章與 lightbox 強調 SHALL 使用 `promo`，且 `#ef6c00` 不得出現於程式碼。促銷橘語意為「促銷信號＋加入購物車行動色」，不得用於其他互動元素。

#### Scenario: 加入購物車鈕為促銷橘
- **WHEN** 商品未加入購物車且未售完
- **THEN** 「加入購物車」按鈕為 `promo` 橘底白字（hover 為 `promo-bright`），白字對比 ≥ 4.5:1

#### Scenario: 一般 CTA 為品牌藍
- **WHEN** 檢視結帳送出鈕、查訂單鈕、OrderSuccessModal 主鈕、stepper 與 active tab
- **THEN** 皆為品牌藍系（`bg-secondary`，hover `secondary-bright`），無 `bg-primary` 按鈕

#### Scenario: 促銷徽章
- **WHEN** 商品帶有促銷摘要（badge）
- **THEN** 徽章底色為 `promo` 降飽和橘

## ADDED Requirements

### Requirement: 字重與字級收斂
全站 SHALL 不使用 `font-black`：大標題用 `font-bold`、小標題與強調用 `font-semibold`；商品卡上價格維持唯一 bold。全站最小字級 SHALL 為 `text-xs`（12px），不得出現 12px 以下的自訂字級。

#### Scenario: 無 font-black 與過小字級
- **WHEN** 掃描 `components/` 與 `app/` 的 class
- **THEN** 無 `font-black`，無 `text-[9px]`/`text-[10px]`/`text-[11px]`

### Requirement: success 與 warning 語意色 token
成功與警示狀態的色彩 SHALL 引用 `app/globals.css` 定義的語意 token（success / success-container / on-success-container / warning / warning-container / on-warning-container，值回寫 `DESIGN.md`），不得使用 Tailwind 內建 amber/green/emerald 色階。

#### Scenario: 訂單成功彈窗語意色
- **WHEN** 訂單成功彈窗顯示（取貨與宅配兩種）
- **THEN** 取貨號碼框用 warning-container 系、LINE 資訊框用 success-container 系、運費金額用 `text-warning`，程式碼無 amber/green/emerald class

### Requirement: 商品卡白灰交錯
商品網格中的卡片背景 SHALL 依序號奇偶交錯：奇數卡白色、偶數卡 `surface-container-low`。圖案隨欄數變化（偶數欄呈直條紋、奇數欄呈棋盤格）為接受之特性。

#### Scenario: 交錯背景
- **WHEN** 商品網格渲染多張卡片
- **THEN** 相鄰序號的卡片背景於白與 `surface-container-low` 間交錯

### Requirement: 手機版 Hero 高度
Hero 區塊在手機寬度 SHALL 以 `svh` 單位限高（70svh、最小 420px），`sm` 以上維持 85vh，避免行動瀏覽器網址列收合造成跳動。

#### Scenario: 手機 Hero
- **WHEN** 以手機視窗寬度載入首頁
- **THEN** Hero 高度約為視窗的 70%（svh），內容與 CTA 完整可見

### Requirement: 價格無會員價前綴
商品卡價格 SHALL 直接顯示金額，不得帶「會員價」或其他會員相關前綴文案。

#### Scenario: 價格顯示
- **WHEN** 商品卡片渲染
- **THEN** 價格前無「會員價」字樣
