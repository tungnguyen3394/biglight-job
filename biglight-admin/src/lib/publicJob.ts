import type { Job } from "@prisma/client";

// Map 求人 (DB) → JSON công khai cho user site (KHÔNG kèm tên công ty).
export function publicJob(j: Job) {
  const open = j.status === "OPEN" && j.recruitCount > j.hiredCount;
  return {
    id: j.id,
    jobCode: j.code,
    title: j.title,
    industry: j.industry,
    jobCategory: j.jobTypeName,
    jobType: j.jobTypeName,
    prefecture: j.location,
    city: j.city,
    locationText: `${j.location}${j.city ? ` ${j.city}` : ""}`,
    salaryMin: j.salaryMin,
    salaryMax: j.salaryMax,
    salaryText: j.payType && j.baseSalary ? `${j.payType} ¥${j.baseSalary.toLocaleString("ja-JP")}` : (j.salaryMin || j.salaryMax ? `¥${(j.salaryMin ?? 0).toLocaleString()}〜¥${(j.salaryMax ?? 0).toLocaleString()}` : null),
    recruitmentCount: j.recruitCount,
    maleCount: j.recruitMale,
    femaleCount: j.recruitFemale,
    japaneseLevel: j.japaneseLevel,
    visaType: j.residenceType,
    employmentType: j.employmentType,
    workingHours: j.workHours,
    holidays: j.holidays,
    dormitory: j.dormitoryAvailable,
    dormitoryFee: j.dormitoryFee,
    nightShift: j.nightShift,
    shiftSystem: j.shiftWork,
    benefits: j.appealPoints,
    jobDescription: j.description,
    tags: j.tags,
    imageUrl: j.imageUrl,
    isFeatured: j.isFeatured,
    isRecommended: j.isRecommended,
    isUrgent: j.isUrgent,
    status: open ? (j.isUrgent ? "急募" : "募集中") : "募集終了",
    publishedAt: j.createdAt,
    updatedAt: j.updatedAt,
    formData: j.formData,
  };
}
