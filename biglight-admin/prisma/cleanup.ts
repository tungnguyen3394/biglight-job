// Xoá dữ liệu SEED (giả) khỏi DB — an toàn, idempotent, chỉ nhắm marker đã biết.
// Giữ nguyên dữ liệu thật: n-tung@biglight.jp, tài khoản Google @biglight.jp thật,
// ứng viên/application/message thật, OptionSet (設定), Article (guide).
//
// Chạy trên VPS:
//   docker compose run --rm --build migrate npx tsx prisma/cleanup.ts
//
// Quyết định đã chốt: XÓA 10 求人 mẫu + công ty/CTV mẫu + 5 tài khoản test (giữ n-tung@).

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SAMPLE_JOB_CODES = ["MFG-001", "CON-002", "FBM-003", "CARE-004", "CON-005", "MFG-006", "AGR-007", "FSV-008", "CLN-009", "AUTO-010"];
const SEED_CAND_IDS = ["seed-cand-1", "seed-msg-c1", "seed-msg-c2", "seed-msg-c3", "seed-msg-c4"];
const SEED_COMPANY = "seed-company-1";
const SEED_CTV = "seed-ctv-1";
const TEST_EMAILS = ["admin@biglight.jp", "staff@biglight.jp", "ctv@biglight.jp", "company@biglight.jp", "candidate@biglight.jp"];

async function main() {
  const log = (m: string, n: number) => console.log(`  - ${m}: ${n}`);

  // ---- ids cần dùng ----
  const jobs = await prisma.job.findMany({ where: { code: { in: SAMPLE_JOB_CODES } }, select: { id: true } });
  const jobIds = jobs.map((j) => j.id);
  const testUsers = await prisma.user.findMany({ where: { email: { in: TEST_EMAILS } }, select: { id: true } });
  const testUserIds = testUsers.map((u) => u.id);

  const apps = await prisma.application.findMany({
    where: { OR: [{ jobId: { in: jobIds } }, { candidateId: { in: SEED_CAND_IDS } }] },
    select: { id: true },
  });
  const appIds = apps.map((a) => a.id);

  console.log("=== BIGLIGHT JOB — cleanup seed data ===");
  console.log(`jobs(mẫu)=${jobIds.length} apps=${appIds.length} testUsers=${testUserIds.length}`);

  // ---- 1) con trước: status history / commissions / applications ----
  log("statusHistory", (await prisma.statusHistory.deleteMany({ where: { applicationId: { in: appIds } } })).count);
  log("candidateCommission", (await prisma.candidateCommission.deleteMany({ where: { OR: [{ applicationId: { in: appIds } }, { jobId: { in: jobIds } }, { candidateId: { in: SEED_CAND_IDS } }] } })).count);
  log("jobCommission", (await prisma.jobCommission.deleteMany({ where: { jobId: { in: jobIds } } })).count);
  log("application", (await prisma.application.deleteMany({ where: { id: { in: appIds } } })).count);

  // ---- 2) ứng viên seed (cascade conversation + message) ----
  log("candidate(seed)", (await prisma.candidate.deleteMany({ where: { id: { in: SEED_CAND_IDS } } })).count);

  // ---- 3) 求人 mẫu ----
  log("job(mẫu)", (await prisma.job.deleteMany({ where: { id: { in: jobIds } } })).count);

  // ---- 4) gỡ tham chiếu tới test users / seed ctv·company (chỉ ảnh hưởng bản ghi gán cho seed) ----
  if (testUserIds.length) {
    await prisma.job.updateMany({ where: { biglightStaffId: { in: testUserIds } }, data: { biglightStaffId: null } });
    await prisma.candidate.updateMany({ where: { biglightStaffId: { in: testUserIds } }, data: { biglightStaffId: null } });
    await prisma.application.updateMany({ where: { biglightStaffId: { in: testUserIds } }, data: { biglightStaffId: null } });
    await prisma.company.updateMany({ where: { biglightStaffId: { in: testUserIds } }, data: { biglightStaffId: null } });
  }
  await prisma.candidate.updateMany({ where: { referralCtvId: SEED_CTV }, data: { referralCtvId: null } });
  await prisma.job.updateMany({ where: { ctvId: SEED_CTV }, data: { ctvId: null } });
  await prisma.application.updateMany({ where: { ctvId: SEED_CTV }, data: { ctvId: null } });

  // ---- 5) tài khoản test (giữ n-tung@biglight.jp) ----
  log("user(test)", (await prisma.user.deleteMany({ where: { email: { in: TEST_EMAILS } } })).count);

  // ---- 6) công ty / CTV mẫu ----
  log("ctv(mẫu)", (await prisma.ctv.deleteMany({ where: { id: SEED_CTV } })).count);
  log("company(mẫu)", (await prisma.company.deleteMany({ where: { id: SEED_COMPANY } })).count);

  // ---- kiểm tra còn lại ----
  const [u, c, j, cand, conv] = await Promise.all([
    prisma.user.count(), prisma.company.count(), prisma.job.count(), prisma.candidate.count(), prisma.conversation.count(),
  ]);
  console.log("=== Còn lại (dữ liệu thật) ===");
  console.log(`  user=${u} company=${c} job=${j} candidate=${cand} conversation=${conv}`);
  console.log("Cleanup done.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
