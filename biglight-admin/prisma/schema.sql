-- ============================================================================
-- BIGLIGHT Job — Admin database schema (PostgreSQL)
-- Tổng hợp toàn bộ cấu trúc dữ liệu để chạy trong pgAdmin.
-- Khớp với prisma/schema.prisma (tên bảng snake_case, tên cột giữ nguyên camelCase).
--
-- Cách dùng: mở pgAdmin -> chọn database -> Query Tool -> dán toàn bộ file này -> Run.
-- (Có thể bọc trong BEGIN; ... COMMIT; nếu muốn chạy như 1 transaction.)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) ENUM TYPES
-- ----------------------------------------------------------------------------
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'BIGLIGHT_STAFF', 'CTV', 'COMPANY', 'CANDIDATE');

CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

CREATE TYPE "ResidenceType" AS ENUM ('TOKUTEI_1', 'TOKUTEI_2', 'IKUSEI', 'GIJINKOKU');

CREATE TYPE "JobOpStatus" AS ENUM ('OPEN', 'PAUSED', 'CLOSED', 'FILLED');

CREATE TYPE "JobPublicStatus" AS ENUM ('PUBLIC', 'PRIVATE', 'DRAFT', 'SUSPENDED', 'PENDING_APPROVAL');

CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'ANY');

CREATE TYPE "ApplicationStatus" AS ENUM (
  'NEW', 'CONSULTING', 'DOC_CHECK', 'CV_SENT', 'INTERVIEW_ARRANGING',
  'INTERVIEW_SCHEDULED', 'INTERVIEWED', 'OFFER', 'CONTRACT', 'VISA_APPLYING',
  'VISA_APPROVED', 'JOIN_SCHEDULED', 'JOINED', 'REJECTED', 'DECLINED', 'CANCELLED'
);

CREATE TYPE "RewardType" AS ENUM ('FIXED', 'MONTHLY_PCT', 'ANNUAL_PCT');

CREATE TYPE "PaymentTiming" AS ENUM ('AFTER_VISA', 'AFTER_JOIN', 'AFTER_1M', 'AFTER_3M');

CREATE TYPE "PaymentStatus" AS ENUM ('NOT_YET', 'ACCRUED', 'SCHEDULED', 'PAID', 'ON_HOLD', 'CANCELLED', 'REFUND');

-- ----------------------------------------------------------------------------
-- 2) TABLES
-- ----------------------------------------------------------------------------

-- users -----------------------------------------------------------------------
CREATE TABLE "users" (
  "id"           TEXT NOT NULL,
  "name"         TEXT NOT NULL,
  "email"        TEXT NOT NULL,
  "passwordHash" TEXT,                       -- null cho tài khoản chỉ đăng nhập Google
  "googleId"     TEXT,                       -- Google "sub"
  "image"        TEXT,                       -- Google avatar URL
  "role"         "Role" NOT NULL DEFAULT 'BIGLIGHT_STAFF',
  "status"       "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
  "companyId"    TEXT,
  "ctvId"        TEXT,
  "lastLoginAt"  TIMESTAMP(3),
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");
CREATE INDEX "users_role_idx" ON "users"("role");

-- companies -------------------------------------------------------------------
CREATE TABLE "companies" (
  "id"              TEXT NOT NULL,
  "name"            TEXT NOT NULL,
  "industry"        TEXT,
  "address"         TEXT,
  "contactName"     TEXT,
  "phone"           TEXT,
  "email"           TEXT,
  "biglightStaffId" TEXT,
  "status"          "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL,
  CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- ctvs ------------------------------------------------------------------------
CREATE TABLE "ctvs" (
  "id"        TEXT NOT NULL,
  "name"      TEXT NOT NULL,
  "phone"     TEXT,
  "email"     TEXT,
  "country"   TEXT,
  "status"    "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ctvs_pkey" PRIMARY KEY ("id")
);

-- jobs ------------------------------------------------------------------------
CREATE TABLE "jobs" (
  "id"                   TEXT NOT NULL,
  "code"                 TEXT NOT NULL,
  "companyId"            TEXT NOT NULL,
  "title"                TEXT NOT NULL,
  "industry"             TEXT NOT NULL,
  "jobTypeName"          TEXT,
  "location"             TEXT NOT NULL,
  "city"                 TEXT,
  "recruitCount"         INTEGER NOT NULL DEFAULT 1,
  "recruitMale"          INTEGER NOT NULL DEFAULT 0,
  "recruitFemale"        INTEGER NOT NULL DEFAULT 0,
  "hiredCount"           INTEGER NOT NULL DEFAULT 0,
  "employmentType"       TEXT,
  "residenceType"        "ResidenceType" NOT NULL DEFAULT 'TOKUTEI_1',
  "description"          TEXT,
  "dailyFlow"            TEXT,
  "requiredExperience"   TEXT,
  "requiredQualification" TEXT,
  "japaneseLevel"        TEXT,
  "ageMin"               INTEGER,
  "ageMax"               INTEGER,
  "genderCondition"      "Gender" NOT NULL DEFAULT 'ANY',
  "nationalityCondition" TEXT,
  "baseSalary"           INTEGER,
  "expectedMonthly"      INTEGER,
  "expectedTakeHome"     INTEGER,
  "salaryMin"            INTEGER,
  "salaryMax"            INTEGER,
  "overtimeHours"        TEXT,
  "bonus"                TEXT,
  "raise"                TEXT,
  "socialInsurance"      TEXT,
  "transportAllowance"   TEXT,
  "holidays"             TEXT,
  "paidLeave"            TEXT,
  "workHours"            TEXT,
  "nightShift"           BOOLEAN NOT NULL DEFAULT false,
  "shiftWork"            BOOLEAN NOT NULL DEFAULT false,
  "alternatingShift"     BOOLEAN NOT NULL DEFAULT false,
  "hasOvertime"          BOOLEAN NOT NULL DEFAULT false,
  "startDate"            TIMESTAMP(3),
  "dormitoryAvailable"   BOOLEAN NOT NULL DEFAULT false,
  "dormitoryFee"         INTEGER,
  "utilitiesCost"        TEXT,
  "wifi"                 TEXT,
  "commuteMethod"        TEXT,
  "stationDistance"      TEXT,
  "bicycleLease"         BOOLEAN NOT NULL DEFAULT false,
  "pickupService"        BOOLEAN NOT NULL DEFAULT false,
  "publicMemo"           TEXT,
  "appealPoints"         TEXT,
  "applyNotes"           TEXT,
  "internalMemo"         TEXT,
  "companyHistory"       TEXT,
  "riskNotes"            TEXT,
  "tags"                 TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "status"               "JobOpStatus" NOT NULL DEFAULT 'OPEN',
  "publicStatus"         "JobPublicStatus" NOT NULL DEFAULT 'DRAFT',
  "biglightStaffId"      TEXT,
  "ctvId"                TEXT,
  "createdAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"            TIMESTAMP(3) NOT NULL,
  CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "jobs_code_key" ON "jobs"("code");
CREATE INDEX "jobs_companyId_idx" ON "jobs"("companyId");
CREATE INDEX "jobs_publicStatus_idx" ON "jobs"("publicStatus");
CREATE INDEX "jobs_ctvId_idx" ON "jobs"("ctvId");

-- candidates ------------------------------------------------------------------
CREATE TABLE "candidates" (
  "id"                  TEXT NOT NULL,
  "name"                TEXT NOT NULL,
  "birthdate"           TIMESTAMP(3),
  "nationality"         TEXT,
  "gender"              "Gender" NOT NULL DEFAULT 'ANY',
  "phone"               TEXT,
  "email"               TEXT,
  "facebookUrl"         TEXT,
  "currentAddress"      TEXT,
  "visaType"            TEXT,
  "visaExpiryDate"      TIMESTAMP(3),
  "currentTokuteiField" TEXT,
  "passedSkillTest"     BOOLEAN NOT NULL DEFAULT false,
  "passedJlpt"          BOOLEAN NOT NULL DEFAULT false,
  "canChangeJobFrom"    TIMESTAMP(3),
  "japaneseLevel"       TEXT,
  "desiredIndustry"     TEXT,
  "desiredLocation"     TEXT,
  "desiredSalary"       INTEGER,
  "canNightShift"       BOOLEAN NOT NULL DEFAULT false,
  "canShiftWork"        BOOLEAN NOT NULL DEFAULT false,
  "canOvertime"         BOOLEAN NOT NULL DEFAULT false,
  "canRelocate"         BOOLEAN NOT NULL DEFAULT false,
  "wantDormitory"       BOOLEAN NOT NULL DEFAULT false,
  "changeReason"        TEXT,
  "documents"           JSONB NOT NULL DEFAULT '{}',
  "consultNote"         TEXT,
  "internalMemo"        TEXT,
  "contactHistory"      TEXT,
  "referralCtvId"       TEXT,
  "biglightStaffId"     TEXT,
  "status"              TEXT NOT NULL DEFAULT '新規',
  "createdAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"           TIMESTAMP(3) NOT NULL,
  CONSTRAINT "candidates_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "candidates_referralCtvId_idx" ON "candidates"("referralCtvId");

-- applications ----------------------------------------------------------------
CREATE TABLE "applications" (
  "id"                  TEXT NOT NULL,
  "candidateId"         TEXT NOT NULL,
  "jobId"               TEXT NOT NULL,
  "companyId"           TEXT NOT NULL,
  "ctvId"               TEXT,
  "biglightStaffId"     TEXT,
  "status"              "ApplicationStatus" NOT NULL DEFAULT 'NEW',
  "nextAction"          TEXT,
  "nextActionDate"      TIMESTAMP(3),
  "interviewDate"       TIMESTAMP(3),
  "offerDate"           TIMESTAMP(3),
  "visaApplicationDate" TIMESTAMP(3),
  "visaApprovalDate"    TIMESTAMP(3),
  "joinDate"            TIMESTAMP(3),
  "internalMemo"        TEXT,
  "createdAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"           TIMESTAMP(3) NOT NULL,
  CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "applications_jobId_idx" ON "applications"("jobId");
CREATE INDEX "applications_candidateId_idx" ON "applications"("candidateId");
CREATE INDEX "applications_companyId_idx" ON "applications"("companyId");
CREATE INDEX "applications_ctvId_idx" ON "applications"("ctvId");
CREATE INDEX "applications_status_idx" ON "applications"("status");

-- job_commissions -------------------------------------------------------------
CREATE TABLE "job_commissions" (
  "id"                   TEXT NOT NULL,
  "jobId"                TEXT NOT NULL,
  "ctvId"                TEXT,
  "amount"               INTEGER NOT NULL DEFAULT 0,
  "rewardType"           "RewardType" NOT NULL DEFAULT 'FIXED',
  "paymentTiming"        "PaymentTiming" NOT NULL DEFAULT 'AFTER_JOIN',
  "paymentCondition"     TEXT,
  "guaranteePeriod"      TEXT,
  "refundRule"           TEXT,
  "paymentStatus"        "PaymentStatus" NOT NULL DEFAULT 'NOT_YET',
  "scheduledPaymentDate" TIMESTAMP(3),
  "paidDate"             TIMESTAMP(3),
  "internalMemo"         TEXT,
  "createdAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"            TIMESTAMP(3) NOT NULL,
  CONSTRAINT "job_commissions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "job_commissions_jobId_idx" ON "job_commissions"("jobId");
CREATE INDEX "job_commissions_ctvId_idx" ON "job_commissions"("ctvId");

-- candidate_commissions -------------------------------------------------------
CREATE TABLE "candidate_commissions" (
  "id"                   TEXT NOT NULL,
  "applicationId"        TEXT NOT NULL,
  "jobId"                TEXT NOT NULL,
  "candidateId"          TEXT NOT NULL,
  "companyId"            TEXT NOT NULL,
  "ctvId"                TEXT,
  "amount"               INTEGER NOT NULL DEFAULT 0,
  "rewardType"           "RewardType" NOT NULL DEFAULT 'FIXED',
  "paymentStatus"        "PaymentStatus" NOT NULL DEFAULT 'NOT_YET',
  "joinedDate"           TIMESTAMP(3),
  "scheduledPaymentDate" TIMESTAMP(3),
  "paidDate"             TIMESTAMP(3),
  "guaranteePeriod"      TEXT,
  "refundRule"           TEXT,
  "memo"                 TEXT,
  "createdAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"            TIMESTAMP(3) NOT NULL,
  CONSTRAINT "candidate_commissions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "candidate_commissions_ctvId_idx" ON "candidate_commissions"("ctvId");
CREATE INDEX "candidate_commissions_companyId_idx" ON "candidate_commissions"("companyId");
CREATE INDEX "candidate_commissions_paymentStatus_idx" ON "candidate_commissions"("paymentStatus");

-- status_histories ------------------------------------------------------------
CREATE TABLE "status_histories" (
  "id"            TEXT NOT NULL,
  "applicationId" TEXT NOT NULL,
  "oldStatus"     TEXT,
  "newStatus"     TEXT NOT NULL,
  "changedBy"     TEXT,
  "changedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "memo"          TEXT,
  CONSTRAINT "status_histories_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "status_histories_applicationId_idx" ON "status_histories"("applicationId");

-- ----------------------------------------------------------------------------
-- 3) FOREIGN KEYS
--    (optional FK -> ON DELETE SET NULL; required FK -> ON DELETE RESTRICT)
-- ----------------------------------------------------------------------------
ALTER TABLE "users"
  ADD CONSTRAINT "users_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "users_ctvId_fkey"     FOREIGN KEY ("ctvId")     REFERENCES "ctvs"("id")      ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "companies"
  ADD CONSTRAINT "companies_biglightStaffId_fkey" FOREIGN KEY ("biglightStaffId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "jobs"
  ADD CONSTRAINT "jobs_companyId_fkey"       FOREIGN KEY ("companyId")       REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "jobs_biglightStaffId_fkey" FOREIGN KEY ("biglightStaffId") REFERENCES "users"("id")     ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "jobs_ctvId_fkey"           FOREIGN KEY ("ctvId")           REFERENCES "ctvs"("id")      ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "candidates"
  ADD CONSTRAINT "candidates_referralCtvId_fkey"   FOREIGN KEY ("referralCtvId")   REFERENCES "ctvs"("id")  ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "candidates_biglightStaffId_fkey" FOREIGN KEY ("biglightStaffId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "applications"
  ADD CONSTRAINT "applications_candidateId_fkey"     FOREIGN KEY ("candidateId")     REFERENCES "candidates"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "applications_jobId_fkey"           FOREIGN KEY ("jobId")           REFERENCES "jobs"("id")       ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "applications_companyId_fkey"       FOREIGN KEY ("companyId")       REFERENCES "companies"("id")  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "applications_ctvId_fkey"           FOREIGN KEY ("ctvId")           REFERENCES "ctvs"("id")       ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "applications_biglightStaffId_fkey" FOREIGN KEY ("biglightStaffId") REFERENCES "users"("id")      ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "job_commissions"
  ADD CONSTRAINT "job_commissions_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "job_commissions_ctvId_fkey" FOREIGN KEY ("ctvId") REFERENCES "ctvs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "candidate_commissions"
  ADD CONSTRAINT "candidate_commissions_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "candidate_commissions_jobId_fkey"         FOREIGN KEY ("jobId")         REFERENCES "jobs"("id")         ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "candidate_commissions_candidateId_fkey"   FOREIGN KEY ("candidateId")   REFERENCES "candidates"("id")   ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "candidate_commissions_companyId_fkey"     FOREIGN KEY ("companyId")     REFERENCES "companies"("id")    ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "candidate_commissions_ctvId_fkey"         FOREIGN KEY ("ctvId")         REFERENCES "ctvs"("id")         ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "status_histories"
  ADD CONSTRAINT "status_histories_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ============================================================================
-- DONE. 9 bảng + 10 enum. Sau khi chạy xong có thể nạp dữ liệu mẫu bằng:
--   npm run db:seed     (trong thư mục biglight-admin)
-- ============================================================================
