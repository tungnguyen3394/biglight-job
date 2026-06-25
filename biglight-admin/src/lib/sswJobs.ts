// 特定技能：分野 → 業務区分 → 従事する主な業務（3段リンクのドロップダウン用）
export type SswField = { field: string; categories: { category: string; mainTasks: string[] }[] };

export const SSW_JOBS: SswField[] = [
  { field: "介護", categories: [{ category: "介護", mainTasks: ["身体介護", "入浴介助", "食事介助", "排せつ介助", "レクリエーション補助", "機能訓練補助"] }] },
  { field: "ビルクリーニング", categories: [{ category: "ビルクリーニング", mainTasks: ["建築物内部の清掃", "床清掃", "トイレ清掃", "洗面台清掃", "客室清掃", "ベッドメイク"] }] },
  {
    field: "工業製品製造業",
    categories: [
      { category: "機械金属加工", mainTasks: ["鋳造", "鍛造", "ダイカスト", "機械加工", "金属プレス加工", "鉄工", "工場板金", "仕上げ", "プラスチック成形", "機械検査", "機械保全", "塗装", "溶接", "工業包装", "金属熱処理"] },
      { category: "電気電子機器組立て", mainTasks: ["機械加工", "仕上げ", "プラスチック成形", "プリント配線板製造", "電子機器組立て", "電気機器組立て", "機械検査", "機械保全", "工業包装"] },
      { category: "金属表面処理", mainTasks: ["めっき", "アルミニウム陽極酸化処理", "バフ研磨"] },
      { category: "紙器・段ボール箱製造", mainTasks: ["紙器・段ボール箱製造"] },
      { category: "コンクリート製品製造", mainTasks: ["コンクリート製品製造"] },
      { category: "RPF製造", mainTasks: ["RPF製造"] },
      { category: "陶磁器製品製造", mainTasks: ["陶磁器工業製品製造"] },
      { category: "印刷・製本", mainTasks: ["印刷", "製本"] },
      { category: "紡織製品製造", mainTasks: ["紡績運転", "織布運転", "染色", "ニット製品製造", "たて編ニット生地製造", "カーペット製造", "製網"] },
      { category: "縫製", mainTasks: ["婦人子供服製造", "紳士服製造", "下着類製造", "寝具製作", "帆布製品製造", "布はく縫製", "座席シート縫製", "カーテン縫製", "タオル縫製"] },
    ],
  },
  {
    field: "建設",
    categories: [
      { category: "土木", mainTasks: ["型枠施工", "コンクリート圧送", "トンネル推進工", "建設機械施工", "土工", "鉄筋施工", "とび"] },
      { category: "建築", mainTasks: ["建築大工", "型枠施工", "左官", "屋根ふき", "鉄筋施工", "鉄筋継手", "内装仕上げ", "表装", "建築板金", "吹付ウレタン断熱"] },
      { category: "ライフライン・設備", mainTasks: ["配管", "保温保冷", "電気通信", "土工", "建設機械施工"] },
    ],
  },
  {
    field: "造船・舶用工業",
    categories: [
      { category: "造船", mainTasks: ["溶接", "塗装", "鉄工", "仕上げ", "機械加工"] },
      { category: "舶用機械", mainTasks: ["舶用機械加工", "舶用機械組立", "仕上げ", "機械保全"] },
      { category: "舶用電気電子機器", mainTasks: ["電気機器組立て", "電子機器組立て", "配線", "機械検査"] },
    ],
  },
  { field: "自動車整備", categories: [{ category: "自動車整備", mainTasks: ["日常点検整備", "定期点検整備", "分解整備", "故障診断", "部品交換"] }] },
  {
    field: "航空",
    categories: [
      { category: "空港グランドハンドリング", mainTasks: ["航空機地上走行支援", "手荷物搭降載", "貨物搭降載", "機内清掃", "機外清掃"] },
      { category: "航空機整備", mainTasks: ["機体点検", "装備品点検", "修理", "部品交換"] },
    ],
  },
  { field: "宿泊", categories: [{ category: "宿泊", mainTasks: ["フロント", "企画・広報", "接客", "レストランサービス", "宿泊サービス提供"] }] },
  {
    field: "自動車運送業",
    categories: [
      { category: "トラック運送", mainTasks: ["貨物自動車運転", "荷物積卸し", "配送", "車両点検"] },
      { category: "タクシー運送", mainTasks: ["旅客自動車運転", "接客", "運賃収受", "車両点検"] },
      { category: "バス運送", mainTasks: ["旅客自動車運転", "乗客案内", "運賃収受", "車両点検"] },
    ],
  },
  {
    field: "鉄道",
    categories: [
      { category: "軌道整備", mainTasks: ["軌道整備", "線路点検", "補修"] },
      { category: "電気設備整備", mainTasks: ["電気設備整備", "点検", "補修"] },
      { category: "車両整備", mainTasks: ["鉄道車両整備", "点検", "修理"] },
      { category: "車両製造", mainTasks: ["鉄道車両製造", "組立", "検査"] },
      { category: "運輸係員", mainTasks: ["駅係員", "車掌", "運転士補助", "旅客対応"] },
    ],
  },
  {
    field: "農業",
    categories: [
      { category: "耕種農業", mainTasks: ["施設園芸", "畑作", "野菜", "果樹"] },
      { category: "畜産農業", mainTasks: ["酪農", "養豚", "養鶏"] },
    ],
  },
  {
    field: "漁業",
    categories: [
      { category: "漁業", mainTasks: ["漁具準備", "漁労作業", "水産物処理"] },
      { category: "養殖業", mainTasks: ["養殖管理", "給餌", "水産物処理"] },
    ],
  },
  { field: "飲食料品製造業", categories: [{ category: "飲食料品製造業", mainTasks: ["食料品製造", "飲料製造", "食肉加工", "水産加工", "惣菜製造", "弁当製造", "パン製造", "菓子製造", "包装", "検品"] }] },
  { field: "外食業", categories: [{ category: "外食業", mainTasks: ["飲食物調理", "接客", "店舗管理", "仕込み", "盛付け", "配膳", "下膳", "レジ", "清掃"] }] },
  { field: "林業", categories: [{ category: "林業", mainTasks: ["育林", "素材生産", "伐採", "集材", "造林", "下刈り"] }] },
  { field: "木材産業", categories: [{ category: "木材産業", mainTasks: ["製材", "木材加工", "合板製造", "集成材製造", "木材乾燥", "検品", "梱包"] }] },
];
