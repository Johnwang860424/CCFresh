import { Product } from "./types";

export const PRODUCTS: Product[] = [
  {
    id: "salmon",
    name: "挪威頂級鮭魚菲力",
    weight: "300g ± 5% / 片",
    price: 320,
    image: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?q=80&w=800&auto=format&fit=crop",
    badge: "熱銷",
    category: "seafood"
  },
  {
    id: "shrimp",
    name: "嚴選特大無毒白蝦",
    weight: "600g ± 5% / 盒",
    price: 450,
    image: "https://images.unsplash.com/photo-1559742811-82410b49c405?q=80&w=800&auto=format&fit=crop",
    category: "seafood"
  },
  {
    id: "wagyu",
    name: "日本A5和牛紐約客",
    weight: "250g ± 5% / 片",
    price: 1280,
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800&auto=format&fit=crop",
    badge: "限量",
    category: "meat"
  },
  {
    id: "scallop",
    name: "北海道生食級干貝 M級",
    weight: "500g ± 5% / 包 (約15-18顆)",
    price: 880,
    image: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?q=80&w=800&auto=format&fit=crop",
    badge: "新品",
    category: "new"
  },
  {
    id: "crab",
    name: "智利熟凍鄂霍次克全隻帝王蟹腳",
    weight: "600g ± 10% / 包",
    price: 1680,
    image: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?q=80&w=800&auto=format&fit=crop",
    badge: "限量",
    category: "seafood"
  },
  {
    id: "angus",
    name: "美國安格斯霜降牛排",
    weight: "300g ± 5% / 片",
    price: 390,
    image: "https://images.unsplash.com/photo-1603048588665-791ca8aea617?q=80&w=800&auto=format&fit=crop",
    category: "meat"
  },
  {
    id: "iberico",
    name: "頂級西班牙伊比利黑豬梅花排",
    weight: "250g ± 5% / 二片裝",
    price: 350,
    image: "https://images.unsplash.com/photo-1602410243482-124b896b0cbc?q=80&w=800&auto=format&fit=crop",
    badge: "熱銷",
    category: "meat"
  },
  {
    id: "lamb",
    name: "法式櫻桃小羊戰斧排",
    weight: "400g ± 5% / 四支裝",
    price: 620,
    image: "https://images.unsplash.com/photo-1602847213180-50e43a80dfdf?q=80&w=800&auto=format&fit=crop",
    badge: "新品",
    category: "new"
  },
  {
    id: "squid",
    name: "澎湖船凍特大鮮槍烏賊(透抽)",
    weight: "350g ± 5% / 二尾裝",
    price: 260,
    image: "https://images.unsplash.com/photo-1534124419619-142614ad5cda?q=80&w=800&auto=format&fit=crop",
    badge: "特惠",
    category: "offers"
  },
  {
    id: "shortrib",
    name: "美國頂級安格斯黑牛無骨牛小排火鍋片",
    weight: "200g ± 5% / 盒",
    price: 490,
    image: "https://images.unsplash.com/photo-1551024506-0bccd828d307?q=80&w=800&auto=format&fit=crop",
    badge: "特惠",
    category: "offers"
  }
];

export const DELIVERY_LOCATIONS = [
  "CC生鮮 台北大安旗艦站 (台北市大安區信義路四段100號)",
  "CC生鮮 新北板橋站 (新北市板橋區文化路二段120號)",
  "CC生鮮 台中公益店 (台中市西區公益路300號)",
  "CC生鮮 高雄左營店 (高雄市左營區博愛二路500號)",
  "低溫宅配 - 專員冷鏈直送到府 (需滿 NT$ 1,500 免運)"
];
