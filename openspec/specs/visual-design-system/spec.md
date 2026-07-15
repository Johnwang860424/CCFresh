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
商品卡片 SHALL 以 1:1 圖片呈現，描述文字 SHALL 為 `text-sm` 並最多顯示 2 行（line-clamp），價格 SHALL 為卡片上唯一加粗且字級最大的文字資訊，品名為 semibold，不得再有獨立的「會員價」大寫小標。

#### Scenario: 卡片版式
- **WHEN** 商品卡片渲染（含描述較長的商品）
- **THEN** 圖片為正方形、描述最多 2 行截斷、價格以 `text-xl` 粗體呈現且與「會員價」小字同行

#### Scenario: hover 效果收斂
- **WHEN** 滑鼠移入商品卡片
- **THEN** 僅圖片微放大與卡片陰影加深，無 shimmer 漸層、品名變色或邊框變色

### Requirement: 強調色語意分工
互動元素（加入購物車、stepper +、active tab、價格）SHALL 使用品牌藍系 token；促銷徽章與 lightbox 強調 SHALL 使用降飽和促銷橘 token（`promo`），且 `#ef6c00` 不得再出現於程式碼。

#### Scenario: CTA 為品牌藍
- **WHEN** 商品未加入購物車且未售完
- **THEN** 「加入購物車」按鈕為品牌藍底白字（hover 為亮一階的藍）

#### Scenario: 促銷徽章
- **WHEN** 商品帶有促銷摘要（badge）
- **THEN** 徽章底色為 `promo` 降飽和橘
