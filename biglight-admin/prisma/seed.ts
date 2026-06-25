import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const PASSWORD = "password123";

async function main() {
  const hash = await bcrypt.hash(PASSWORD, 10);

  // ---- companies & ctvs ----
  const company = await prisma.company.upsert({
    where: { id: "seed-company-1" },
    update: {},
    create: {
      id: "seed-company-1",
      name: "中部金属工業 株式会社",
      industry: "工業製品製造業",
      address: "愛知県豊田市",
      contactName: "山田 太郎",
      phone: "0565-00-0000",
      email: "hr@chubu-metal.example.jp",
    },
  });

  const ctv = await prisma.ctv.upsert({
    where: { id: "seed-ctv-1" },
    update: {},
    create: {
      id: "seed-ctv-1",
      name: "Tran Van CTV",
      phone: "090-0000-0000",
      email: "ctv1@biglight.example.jp",
      country: "ベトナム",
    },
  });

  // ---- users (one per role) ----
  const superAdmin = await prisma.user.upsert({
    where: { email: "admin@biglight.jp" },
    update: {},
    create: { name: "Super Admin", email: "admin@biglight.jp", passwordHash: hash, role: "SUPER_ADMIN" },
  });

  // Tài khoản admin chính (đăng nhập bằng Google/Facebook hoặc mật khẩu password123).
  // update: đảm bảo luôn là SUPER_ADMIN + ACTIVE kể cả khi đã tồn tại.
  await prisma.user.upsert({
    where: { email: "n-tung@biglight.jp" },
    update: { role: "SUPER_ADMIN", status: "ACTIVE" },
    create: { name: "Nguyen Tung", email: "n-tung@biglight.jp", passwordHash: hash, role: "SUPER_ADMIN" },
  });
  await prisma.user.upsert({
    where: { email: "staff@biglight.jp" },
    update: {},
    create: { name: "BIGLIGHT スタッフ", email: "staff@biglight.jp", passwordHash: hash, role: "BIGLIGHT_STAFF" },
  });
  await prisma.user.upsert({
    where: { email: "ctv@biglight.jp" },
    update: {},
    create: { name: "CTV パートナー", email: "ctv@biglight.jp", passwordHash: hash, role: "CTV", ctvId: ctv.id },
  });
  await prisma.user.upsert({
    where: { email: "company@biglight.jp" },
    update: {},
    create: { name: "企業ユーザー", email: "company@biglight.jp", passwordHash: hash, role: "COMPANY", companyId: company.id },
  });
  await prisma.user.upsert({
    where: { email: "candidate@biglight.jp" },
    update: {},
    create: { name: "応募者ユーザー", email: "candidate@biglight.jp", passwordHash: hash, role: "CANDIDATE" },
  });

  // ---- jobs ----
  const job1 = await prisma.job.upsert({
    where: { code: "MFG-001" },
    update: {},
    create: {
      code: "MFG-001",
      companyId: company.id,
      title: "半自動溶接スタッフ",
      industry: "工業製品製造業",
      jobTypeName: "溶接",
      location: "愛知県",
      city: "豊田市",
      recruitCount: 5,
      recruitMale: 4,
      recruitFemale: 1,
      hiredCount: 1,
      residenceType: "TOKUTEI_1",
      salaryMin: 230000,
      salaryMax: 300000,
      baseSalary: 200000,
      expectedMonthly: 250000,
      expectedTakeHome: 200000,
      nightShift: false,
      shiftWork: true,
      dormitoryAvailable: true,
      dormitoryFee: 20000,
      status: "OPEN",
      publicStatus: "PUBLIC",
      biglightStaffId: superAdmin.id,
      ctvId: ctv.id,
      tags: ["寮あり", "高収入", "未経験OK"],
      internalMemo: "社内メモ：企業の採用ペースは速い。",
    },
  });

  await prisma.jobCommission.upsert({
    where: { id: "seed-jobcomm-1" },
    update: {},
    create: {
      id: "seed-jobcomm-1",
      jobId: job1.id,
      ctvId: ctv.id,
      amount: 300000,
      rewardType: "FIXED",
      paymentTiming: "AFTER_JOIN",
      guaranteePeriod: "6ヶ月",
      paymentStatus: "NOT_YET",
    },
  });

  await prisma.job.upsert({
    where: { code: "CON-002" },
    update: {},
    create: {
      code: "CON-002",
      companyId: company.id,
      title: "型枠大工",
      industry: "建設業",
      jobTypeName: "型枠",
      location: "愛知県",
      city: "名古屋市",
      recruitCount: 8,
      recruitMale: 8,
      recruitFemale: 0,
      residenceType: "TOKUTEI_1",
      salaryMin: 250000,
      salaryMax: 340000,
      dormitoryAvailable: true,
      status: "OPEN",
      publicStatus: "PENDING_APPROVAL",
      biglightStaffId: superAdmin.id,
      tags: ["寮あり", "高収入"],
    },
  });

  // ---- 7 đơn mẫu công khai (đa dạng ngành/địa điểm/lương) ----
  const SAMPLE_JOBS = [
    {
      code: "FBM-003", title: "惣菜製造スタッフ（未経験OK・寮あり）", industry: "飲食料品製造業", jobTypeName: "惣菜製造",
      location: "岐阜県", city: "各務原市", recruitCount: 6, recruitMale: 3, recruitFemale: 3, residenceType: "TOKUTEI_1" as const,
      payType: "月給", baseSalary: 190000, expectedMonthly: 235000, expectedTakeHome: 192000, salaryMin: 190000, salaryMax: 260000,
      workHours: "8:30〜17:30（休憩60分・実働8時間）", overtimeHours: "月平均15時間程度（全額支給）", holidays: "シフト制／週休2日／年間休日110日",
      bonus: "賞与年2回（前年実績 計1.5ヶ月）", japaneseLevel: "N4", dormitoryAvailable: true, dormitoryFee: 18000, utilitiesCost: "実費（月約8,000円）", wifi: "無料",
      commuteMethod: "自転車・徒歩（寮から約10分）", stationDistance: "最寄駅からバス15分",
      description: "工場内でお惣菜の調理補助・盛付け・包装・検品を担当します。マニュアルが整っており、未経験の方も安心して始められます。",
      dailyFlow: "出勤→衛生チェック→仕込み→盛付け・包装→清掃→退勤", appealPoints: "空調完備で年中快適／女性スタッフが多数活躍／コツコツ作業が好きな方に最適。",
      tags: ["寮あり", "未経験OK", "女性活躍", "土日休み"],
    },
    {
      code: "CARE-004", title: "介護スタッフ（研修充実・N3歓迎）", industry: "介護業", jobTypeName: "介護",
      location: "三重県", city: "四日市市", recruitCount: 4, recruitMale: 1, recruitFemale: 3, residenceType: "TOKUTEI_1" as const,
      payType: "月給", baseSalary: 200000, expectedMonthly: 245000, expectedTakeHome: 198000, salaryMin: 200000, salaryMax: 270000,
      workHours: "early/day/late のシフト制（実働8時間）", overtimeHours: "月平均10時間程度", holidays: "4週8休／年間休日112日",
      bonus: "賞与年2回", japaneseLevel: "N3", dormitoryAvailable: true, dormitoryFee: 15000, utilitiesCost: "実費", wifi: "無料",
      commuteMethod: "送迎あり", stationDistance: "近鉄駅から徒歩12分",
      description: "高齢者施設での食事・入浴・移動などの生活介助を担当します。先輩スタッフの丁寧な指導と研修制度で、安心してスキルを身につけられます。",
      dailyFlow: "申し送り→食事介助→入浴介助→レクリエーション→記録→退勤", appealPoints: "人に寄り添うやりがいのある仕事／資格取得支援あり／女性活躍中。",
      tags: ["寮あり", "女性活躍", "送迎あり", "長期歓迎"],
    },
    {
      code: "CON-005", title: "鉄筋工（高収入・日給制）", industry: "建設業", jobTypeName: "鉄筋施工",
      location: "大阪府", city: "大阪市", recruitCount: 6, recruitMale: 6, recruitFemale: 0, residenceType: "TOKUTEI_1" as const,
      payType: "日給", baseSalary: 13000, expectedMonthly: 290000, expectedTakeHome: 235000, salaryMin: 270000, salaryMax: 360000,
      workHours: "8:00〜17:00", overtimeHours: "現場による（全額支給）", holidays: "日曜・隔週土曜／年間休日95日",
      bonus: "報奨金あり", japaneseLevel: "N4", dormitoryAvailable: true, dormitoryFee: 22000, utilitiesCost: "実費", wifi: "無料",
      commuteMethod: "社用車で現場へ送迎", stationDistance: "寮は地下鉄駅から徒歩8分",
      description: "建設現場で鉄筋の加工・組立を担当します。チームで安全第一に作業を進め、未経験から技能を身につけられる環境です。",
      dailyFlow: "朝礼・KY活動→鉄筋加工→組立・結束→片付け→退勤", appealPoints: "日給制で頑張りが収入に直結／手に職がつく／実習経験者は即戦力歓迎。",
      tags: ["高収入", "寮あり", "特定技能2号可"],
    },
    {
      code: "MFG-006", title: "金属プレス加工オペレーター（未経験OK）", industry: "工業製品製造業", jobTypeName: "金属プレス加工",
      location: "静岡県", city: "浜松市", recruitCount: 5, recruitMale: 4, recruitFemale: 1, residenceType: "TOKUTEI_1" as const,
      payType: "時給", baseSalary: 1350, expectedMonthly: 255000, expectedTakeHome: 205000, salaryMin: 230000, salaryMax: 290000,
      workHours: "2交替（8:00〜17:00 / 20:00〜翌5:00）", overtimeHours: "月平均20時間（全額支給）", holidays: "土日休み（会社カレンダー）／年間休日121日",
      bonus: "賞与年2回（計2.0ヶ月）", japaneseLevel: "N4", dormitoryAvailable: true, dormitoryFee: 20000, utilitiesCost: "寮費に込み", wifi: "無料",
      commuteMethod: "マイカー通勤可", stationDistance: "寮はJR駅から徒歩10分",
      description: "自動車部品の金属プレス加工を担当します。機械への材料セットと加工・検査が中心で、丁寧な指導があるため未経験でも安心です。",
      dailyFlow: "出勤→機械点検→材料セット→加工・検査→記録→退勤", appealPoints: "交替勤務で月収アップ／寮費に光熱費込み／土日休みでメリハリ。",
      tags: ["未経験OK", "高収入", "寮あり", "土日休み"],
    },
    {
      code: "AGR-007", title: "施設園芸スタッフ（自然の中で働く）", industry: "農業", jobTypeName: "施設園芸",
      location: "長野県", city: "塩尻市", recruitCount: 5, recruitMale: 3, recruitFemale: 2, residenceType: "TOKUTEI_1" as const,
      payType: "月給", baseSalary: 185000, expectedMonthly: 220000, expectedTakeHome: 182000, salaryMin: 185000, salaryMax: 240000,
      workHours: "7:00〜16:00（季節により変動）", overtimeHours: "繁忙期のみ", holidays: "週1日＋シフト休／年間休日100日",
      bonus: "—", japaneseLevel: "勉強中でも可", dormitoryAvailable: true, dormitoryFee: 12000, utilitiesCost: "実費", wifi: "無料",
      commuteMethod: "送迎あり", stationDistance: "—",
      description: "ハウスでの野菜の栽培・収穫・出荷準備を担当します。自然の中で体を動かして働けるお仕事です。",
      dailyFlow: "出勤→収穫→選別・箱詰め→管理作業→退勤", appealPoints: "日本語が不安でも応募OK／寮費が安く生活費を抑えられる／チームで和やかに作業。",
      tags: ["寮あり", "日本語不問", "送迎あり", "未経験OK"],
    },
    {
      code: "FSV-008", title: "ホール・キッチンスタッフ（駅近）", industry: "外食業", jobTypeName: "接客・調理補助",
      location: "東京都", city: "新宿区", recruitCount: 4, recruitMale: 2, recruitFemale: 2, residenceType: "TOKUTEI_1" as const,
      payType: "時給", baseSalary: 1300, expectedMonthly: 240000, expectedTakeHome: 196000, salaryMin: 220000, salaryMax: 280000,
      workHours: "シフト制（10:00〜22:00の間で実働8時間）", overtimeHours: "月平均10時間", holidays: "シフト制／週休2日",
      bonus: "—", japaneseLevel: "N3", dormitoryAvailable: false, dormitoryFee: null, utilitiesCost: "—", wifi: "—",
      commuteMethod: "電車通勤（交通費支給）", stationDistance: "各線新宿駅から徒歩5分",
      description: "店舗でのホール接客・調理補助を担当します。お客様への接客や店内オペレーションを通じて、日本のサービスを学べます。",
      dailyFlow: "出勤→仕込み→接客・配膳→片付け→退勤", appealPoints: "駅近で通勤ラクラク／接客で日本語が上達／まかないあり。",
      tags: ["駅近", "未経験OK"],
    },
    {
      code: "CLN-009", title: "ホテル客室清掃（女性活躍）", industry: "ビルクリーニング", jobTypeName: "客室清掃",
      location: "兵庫県", city: "神戸市", recruitCount: 5, recruitMale: 1, recruitFemale: 4, residenceType: "TOKUTEI_1" as const,
      payType: "月給", baseSalary: 188000, expectedMonthly: 225000, expectedTakeHome: 186000, salaryMin: 188000, salaryMax: 245000,
      workHours: "9:00〜17:00（休憩60分）", overtimeHours: "ほぼなし", holidays: "シフト制／週休2日／年間休日108日",
      bonus: "賞与年1回", japaneseLevel: "N4", dormitoryAvailable: true, dormitoryFee: 16000, utilitiesCost: "実費", wifi: "無料",
      commuteMethod: "徒歩・自転車", stationDistance: "三宮駅からバス10分",
      description: "ホテルの客室清掃・ベッドメイク・水回りの清掃を担当します。マニュアルに沿った作業で未経験でも安心です。",
      dailyFlow: "朝礼→客室清掃→ベッドメイク→点検→退勤", appealPoints: "残業ほぼなしで生活リズムが整う／女性専用寮あり／きれい好きな方歓迎。",
      tags: ["寮あり", "女性活躍", "残業少なめ", "個室寮"],
    },
  ];
  for (const j of SAMPLE_JOBS) {
    await prisma.job.upsert({
      where: { code: j.code },
      update: {},
      create: { ...j, companyId: company.id, status: "OPEN", publicStatus: "PUBLIC", biglightStaffId: superAdmin.id },
    });
  }

  // ---- candidate + application ----
  const cand = await prisma.candidate.upsert({
    where: { id: "seed-cand-1" },
    update: {},
    create: {
      id: "seed-cand-1",
      name: "Nguyen Van A",
      nationality: "ベトナム",
      gender: "MALE",
      phone: "080-0000-0000",
      email: "nguyenvana@example.com",
      visaType: "技能実習2号",
      japaneseLevel: "N4",
      desiredIndustry: "工業製品製造業",
      desiredLocation: "愛知県",
      referralCtvId: ctv.id,
      biglightStaffId: superAdmin.id,
    },
  });

  const app = await prisma.application.upsert({
    where: { id: "seed-app-1" },
    update: {},
    create: {
      id: "seed-app-1",
      candidateId: cand.id,
      jobId: job1.id,
      companyId: company.id,
      ctvId: ctv.id,
      biglightStaffId: superAdmin.id,
      status: "INTERVIEW_SCHEDULED",
      nextAction: "面接日程の確定",
    },
  });

  await prisma.candidateCommission.upsert({
    where: { id: "seed-candcomm-1" },
    update: {},
    create: {
      id: "seed-candcomm-1",
      applicationId: app.id,
      jobId: job1.id,
      candidateId: cand.id,
      companyId: company.id,
      ctvId: ctv.id,
      amount: 300000,
      rewardType: "FIXED",
      paymentStatus: "ACCRUED",
    },
  });

  console.log("Seed done. Login with any of these (password: " + PASSWORD + "):");
  console.log("  admin@biglight.jp      (SUPER_ADMIN)");
  console.log("  staff@biglight.jp      (BIGLIGHT_STAFF)");
  console.log("  ctv@biglight.jp        (CTV)");
  console.log("  company@biglight.jp    (COMPANY)");
  console.log("  candidate@biglight.jp  (CANDIDATE)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
