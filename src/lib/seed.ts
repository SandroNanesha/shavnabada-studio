import 'dotenv/config'
import { PrismaClient, Prisma } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import {
  locations,
  groups,
  teachers,
  tags,
  classifications,
  pupils,
  payments,
  applications,
} from './mock-data'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding database...')

  // 1. Locations
  for (const loc of locations) {
    await prisma.location.upsert({
      where: { id: loc.id },
      update: { name: loc.name },
      create: { id: loc.id, name: loc.name },
    })
  }
  console.log(`Upserted ${locations.length} locations`)

  // 2. Groups
  for (const grp of groups) {
    await prisma.group.upsert({
      where: { id: grp.id },
      update: { name: grp.name, locationId: grp.locationId },
      create: { id: grp.id, name: grp.name, locationId: grp.locationId },
    })
  }
  console.log(`Upserted ${groups.length} groups`)

  // 3. Tags
  for (const tag of tags) {
    await prisma.tag.upsert({
      where: { id: tag.id },
      update: { label: tag.label },
      create: { id: tag.id, label: tag.label },
    })
  }
  console.log(`Upserted ${tags.length} tags`)

  // 4. PaymentClassifications
  for (const cls of classifications) {
    await prisma.paymentClassification.upsert({
      where: { id: cls.id },
      update: { name: cls.name, type: cls.type, value: cls.value },
      create: { id: cls.id, name: cls.name, type: cls.type, value: cls.value },
    })
  }
  console.log(`Upserted ${classifications.length} classifications`)

  // 5. Teachers
  for (const tch of teachers) {
    await prisma.teacher.upsert({
      where: { id: tch.id },
      update: { name: tch.name, contact: tch.contact, role: tch.role },
      create: { id: tch.id, name: tch.name, contact: tch.contact, role: tch.role },
    })
    // TeacherGroup join records
    // Delete existing and re-insert to handle changes
    await prisma.teacherGroup.deleteMany({ where: { teacherId: tch.id } })
    for (const groupId of tch.groupIds) {
      await prisma.teacherGroup.create({ data: { teacherId: tch.id, groupId } })
    }
  }
  console.log(`Upserted ${teachers.length} teachers`)

  // 6. Pupils with their relations
  for (const pupil of pupils) {
    await prisma.pupil.upsert({
      where: { id: pupil.id },
      update: {
        firstName: pupil.firstName,
        surname: pupil.surname,
        idNumber: pupil.idNumber,
        birthDate: pupil.birthDate,
        category: pupil.category,
        condition: pupil.condition,
        archived: pupil.archived,
      },
      create: {
        id: pupil.id,
        firstName: pupil.firstName,
        surname: pupil.surname,
        idNumber: pupil.idNumber,
        birthDate: pupil.birthDate,
        category: pupil.category,
        condition: pupil.condition,
        archived: pupil.archived,
      },
    })

    // Parents: delete existing then re-insert
    await prisma.pupilParent.deleteMany({ where: { pupilId: pupil.id } })
    for (let i = 0; i < pupil.parents.length; i++) {
      const p = pupil.parents[i]
      await prisma.pupilParent.create({
        data: { pupilId: pupil.id, name: p.name, phone: p.phone, order: i },
      })
    }

    // Notes: delete existing then re-insert
    await prisma.pupilNote.deleteMany({ where: { pupilId: pupil.id } })
    for (const note of pupil.notes) {
      await prisma.pupilNote.create({
        data: { id: note.id, pupilId: pupil.id, date: note.date, text: note.text },
      })
    }

    // Tags: delete existing then re-insert
    await prisma.pupilTag.deleteMany({ where: { pupilId: pupil.id } })
    for (const tagId of pupil.tagIds) {
      await prisma.pupilTag.create({ data: { pupilId: pupil.id, tagId } })
    }

    // Enrollments
    for (const enr of pupil.enrollments) {
      await prisma.enrollment.upsert({
        where: { id: enr.id },
        update: {
          groupId: enr.groupId,
          startDate: enr.startDate,
          endDate: enr.endDate ?? null,
          baseFee: enr.baseFee,
          discount: enr.discount,
          classificationId: enr.classificationId ?? null,
          customTerms: enr.customTerms,
          billingActive: enr.billingActive,
          prorateFirstMonth: enr.prorateFirstMonth,
          monthOverrides: enr.monthOverrides as Prisma.InputJsonValue,
          monthPaidAmountOverrides: (enr.monthPaidAmountOverrides ?? {}) as Prisma.InputJsonValue,
          monthDueOverrides: (enr.monthDueOverrides ?? {}) as Prisma.InputJsonValue,
          groupHistory: enr.groupHistory as unknown as Prisma.InputJsonValue,
          classificationHistory: enr.classificationHistory as unknown as Prisma.InputJsonValue,
        },
        create: {
          id: enr.id,
          pupilId: pupil.id,
          groupId: enr.groupId,
          startDate: enr.startDate,
          endDate: enr.endDate ?? null,
          baseFee: enr.baseFee,
          discount: enr.discount,
          classificationId: enr.classificationId ?? null,
          customTerms: enr.customTerms,
          billingActive: enr.billingActive,
          prorateFirstMonth: enr.prorateFirstMonth,
          monthOverrides: enr.monthOverrides as Prisma.InputJsonValue,
          monthPaidAmountOverrides: (enr.monthPaidAmountOverrides ?? {}) as Prisma.InputJsonValue,
          monthDueOverrides: (enr.monthDueOverrides ?? {}) as Prisma.InputJsonValue,
          groupHistory: enr.groupHistory as unknown as Prisma.InputJsonValue,
          classificationHistory: enr.classificationHistory as unknown as Prisma.InputJsonValue,
        },
      })
    }
  }
  console.log(`Upserted ${pupils.length} pupils`)

  // 7. Payments (delete all and re-insert for simplicity)
  await prisma.payment.deleteMany({})
  for (const pay of payments) {
    await prisma.payment.create({
      data: {
        id: pay.id,
        pupilId: pay.pupilId,
        enrollmentId: pay.enrollmentId,
        amount: pay.amount,
        date: pay.date,
      },
    })
  }
  console.log(`Inserted ${payments.length} payments`)

  // 8. Applications
  for (const app of applications) {
    await prisma.application.upsert({
      where: { id: app.id },
      update: {
        pupilFirstName: app.pupilFirstName,
        pupilSurname: app.pupilSurname,
        birthDate: app.birthDate,
        documentFilename: app.documentFilename ?? null,
        status: app.status,
        submittedAt: app.submittedAt,
      },
      create: {
        id: app.id,
        pupilFirstName: app.pupilFirstName,
        pupilSurname: app.pupilSurname,
        birthDate: app.birthDate,
        documentFilename: app.documentFilename ?? null,
        status: app.status,
        submittedAt: app.submittedAt,
      },
    })

    // Parents
    await prisma.applicationParent.deleteMany({ where: { applicationId: app.id } })
    for (let i = 0; i < app.parents.length; i++) {
      const p = app.parents[i]
      await prisma.applicationParent.create({
        data: { applicationId: app.id, name: p.name, phone: p.phone, order: i },
      })
    }

    // Custom values
    await prisma.applicationCustomValue.deleteMany({ where: { applicationId: app.id } })
    for (const cv of app.customValues) {
      await prisma.applicationCustomValue.create({
        data: { applicationId: app.id, label: cv.label, value: cv.value },
      })
    }
  }
  console.log(`Upserted ${applications.length} applications`)

  console.log('Done!')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
