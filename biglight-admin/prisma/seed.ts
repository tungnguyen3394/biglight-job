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
