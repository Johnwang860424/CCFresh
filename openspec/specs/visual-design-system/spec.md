## ADDED Requirements

### Requirement: 色彩來自設計 token
UI 元件的色彩 SHALL 引用 `app/globals.css` 中以 Tailwind `@theme` 定義的設計 token（來源為 `DESIGN.md` 調色盤），不得新增硬編碼 hex 色值或與 token 語意重複的 Tailwind 內建色。

#### Scenario: 元件使用 token
- **WHEN** 檢視 `components/` 下元件的色彩 class
- **THEN** 背景、文字、邊框色皆引用 token（如 `bg-surface`、`text-on-surface-variant`），promo 橘與品牌藍不以字面 hex 出現在元件內

### Requirement: 商品區為淺色呈現
精選商品區 SHALL 使用淺色底（`surface`），區內的分類 tab、版面切換器、載入/錯誤/空狀態框與購物車浮動條 SHALL 為淺色卡搭配柔和（非發光）陰影，且不得出現深色底或帶色暈光陰影。

#### Scenario: 商品區底色
- **WHEN** 頁面載入並捲動到「精選商品」區
- **THEN** 區塊底為淺色 `surface`，無格線紋理 overlay，標題為深藍而非白字

#### Scenario: 購物車浮動條
- **WHEN** 購物車有商品而浮動條出現
- **THEN** 浮動條為白底淺色卡、柔和陰影，文字為深色

### Requirement: 商品卡片資訊層次
商品卡片 SHALL 以 1:1 圖片呈現，描述文字 SHALL 為 `text-sm` 並最多顯示 2 行（line-clamp），價格 SHALL 為卡片上唯一加粗且字級最大的文字資訊，品名為 semibold，不得有「會員價」等會員相關小標或前綴。

#### Scenario: 卡片版式
- **WHEN** 商品卡片渲染（含描述較長的商品）
- **THEN** 圖片為正方形、描述最多 2 行截斷、價格以 `text-xl` 粗體呈現且無任何前綴文案

#### Scenario: hover 效果收斂
- **WHEN** 滑鼠移入商品卡片
- **THEN** 僅圖片微放大與卡片陰影加深，無 shimmer 漸層、品名變色或邊框變色

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

### Requirement: 字重與字級收斂
全站 SHALL 不使用 `font-black`（唯一例外：Hero 主標題保留 `font-black` 維持視覺衝擊力）：大標題用 `font-bold`、小標題與強調用 `font-semibold`；商品卡上價格維持唯一 bold。全站最小字級 SHALL 為 `text-xs`（12px），不得出現 12px 以下的自訂字級。

#### Scenario: 無 font-black 與過小字級
- **WHEN** 掃描 `components/` 與 `app/` 的 class
- **THEN** `font-black` 僅出現於 Hero 主標題一處，無 `text-[9px]`/`text-[10px]`/`text-[11px]`

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
