// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import faculties from '../data/faculties.json'

const prisma = new PrismaClient()

// Core subject mapping to seed realistic syllabus
const subjectsMap: Record<string, { semester: number; code: string; title: string }[]> = {
  bca: [
    // Sem 1
    { semester: 1, code: "CACS101", title: "Computer Fundamentals & Applications" },
    { semester: 1, code: "CACS102", title: "Society & Technology" },
    { semester: 1, code: "CACS103", title: "English I" },
    { semester: 1, code: "CACS104", title: "Mathematics I" },
    { semester: 1, code: "CACS105", title: "C Programming" },
    // Sem 2
    { semester: 2, code: "CACS151", title: "Digital Logic" },
    { semester: 2, code: "CACS152", title: "Discrete Structure" },
    { semester: 2, code: "CACS153", title: "English II" },
    { semester: 2, code: "CACS154", title: "Mathematics II" },
    { semester: 2, code: "CACS155", title: "Object Oriented Programming in C++" },
    // Sem 3
    { semester: 3, code: "CACS201", title: "Data Structures and Algorithms" },
    { semester: 3, code: "CACS202", title: "System Analysis and Design" },
    { semester: 3, code: "CACS203", title: "Microprocessor" },
    { semester: 3, code: "CACS204", title: "Numerical Methods" },
    { semester: 3, code: "CACS205", title: "Computer Architecture" },
    // Sem 4
    { semester: 4, code: "CACS251", title: "Operating System" },
    { semester: 4, code: "CACS252", title: "Database Management System" },
    { semester: 4, code: "CACS253", title: "Software Engineering" },
    { semester: 4, code: "CACS254", title: "Scripting Language" },
    { semester: 4, code: "CACS255", title: "Probability & Statistics" },
    // Sem 5
    { semester: 5, code: "CACS301", title: "MIS & E-Business" },
    { semester: 5, code: "CACS302", title: "Dot Net Technology" },
    { semester: 5, code: "CACS303", title: "Computer Networking" },
    { semester: 5, code: "CACS304", title: "Introduction to Management" },
    { semester: 5, code: "CACS305", title: "Computer Graphics" },
    // Sem 6
    { semester: 6, code: "CACS351", title: "Mobile Programming" },
    { semester: 6, code: "CACS352", title: "Distributed System" },
    { semester: 6, code: "CACS353", title: "Applied Economics" },
    { semester: 6, code: "CACS354", title: "Advanced Java Programming" },
    { semester: 6, code: "CACS355", title: "Network Security" }
  ],
  csit: [
    // Sem 1
    { semester: 1, code: "CSC109", title: "Introduction to Information Technology" },
    { semester: 1, code: "CSC110", title: "C Programming" },
    { semester: 1, code: "CSC111", title: "Digital Logic" },
    { semester: 1, code: "MTH112", title: "Mathematics I" },
    { semester: 1, code: "PHY113", title: "Physics" },
    // Sem 2
    { semester: 2, code: "CSC160", title: "Discrete Structure" },
    { semester: 2, code: "CSC161", title: "Object Oriented Programming" },
    { semester: 2, code: "CSC162", title: "Microprocessor" },
    { semester: 2, code: "MTH163", title: "Mathematics II" },
    { semester: 2, code: "STA164", title: "Statistics I" },
    // Sem 3
    { semester: 3, code: "CSC206", title: "Data Structures and Algorithms" },
    { semester: 3, code: "CSC207", title: "Numerical Method" },
    { semester: 3, code: "CSC208", title: "Computer Architecture" },
    { semester: 3, code: "CSC209", title: "Computer Graphics" },
    { semester: 3, code: "STA210", title: "Statistics II" },
    // Sem 4
    { semester: 4, code: "CSC257", title: "Theory of Computation" },
    { semester: 4, code: "CSC258", title: "Computer Networks" },
    { semester: 4, code: "CSC259", title: "Operating Systems" },
    { semester: 4, code: "CSC260", title: "Database Management System" },
    { semester: 4, code: "CSC261", title: "Artificial Intelligence" },
    // Sem 5
    { semester: 5, code: "CSC314", title: "Design and Analysis of Algorithms" },
    { semester: 5, code: "CSC315", title: "System Analysis and Design" },
    { semester: 5, code: "CSC316", title: "Cryptography" },
    { semester: 5, code: "CSC317", title: "Simulation and Modeling" },
    { semester: 5, code: "CSC318", title: "Web Technology" }
  ],
  bbs: [
    // Year 1
    { semester: 1, code: "MGT201", title: "Business English" },
    { semester: 1, code: "MGT202", title: "Business Statistics" },
    { semester: 1, code: "MGT203", title: "Microeconomics" },
    { semester: 1, code: "MGT211", title: "Financial Accounting" },
    { semester: 1, code: "MGT213", title: "Principles of Management" },
    // Year 2
    { semester: 2, code: "MGT205", title: "Business Communication" },
    { semester: 2, code: "MGT206", title: "Macroeconomics" },
    { semester: 2, code: "MGT212", title: "Cost & Management Accounting" },
    { semester: 2, code: "MGT214", title: "Fundamentals of Marketing" },
    { semester: 2, code: "MGT216", title: "Foundations of Human Resource Management" },
    // Year 3
    { semester: 3, code: "MGT204", title: "Business Law" },
    { semester: 3, code: "MGT215", title: "Fundamentals of Financial Management" },
    { semester: 3, code: "MGT217", title: "Business Environment & Strategy" },
    { semester: 3, code: "MGT218", title: "Taxation in Nepal" },
    { semester: 3, code: "MGT219", title: "Organizational Behavior" }
  ]
}

async function main() {
  console.log('🌱 Seeding TU faculties, semesters, and subjects...')
  
  for (const fac of faculties) {
    const systemType = fac.systemType as 'SEMESTER' | 'YEARLY'
    
    // Create Faculty
    const faculty = await prisma.faculty.upsert({
      where: { id: fac.id },
      create: {
        id: fac.id,
        name: fac.name,
        slug: fac.slug,
        icon: fac.icon,
        systemType,
      },
      update: {
        name: fac.name,
        icon: fac.icon,
        systemType,
      }
    })

    // Create Semesters/Years
    for (let o = 1; o <= fac.semCount; o++) {
      const suffix = systemType === 'YEARLY' ? 'Year' : 'Semester'
      const ords = o === 1 ? '1st' : o === 2 ? '2nd' : o === 3 ? '3rd' : `${o}th`
      const semName = `${ords} ${suffix}`

      // Check if semester already exists
      let semester = await prisma.semester.findFirst({
        where: { facultyId: faculty.id, order: o }
      })

      if (!semester) {
        semester = await prisma.semester.create({
          data: {
            name: semName,
            order: o,
            facultyId: faculty.id
          }
        })
      }

      // Seed subjects if we have mapped them
      const subsToSeed = subjectsMap[fac.id]?.filter(s => s.semester === o) || []
      for (const s of subsToSeed) {
        await prisma.subject.upsert({
          where: { id: `${fac.id}-s${o}-${s.code.toLowerCase()}` },
          create: {
            id: `${fac.id}-s${o}-${s.code.toLowerCase()}`,
            title: s.title,
            code: s.code,
            semesterId: semester.id
          },
          update: {
            title: s.title,
            code: s.code
          }
        })
      }
    }
    
    console.log(`✅ Seeded: ${fac.id.toUpperCase()} with ${fac.semCount} ${systemType.toLowerCase()} periods`)
  }

  // Create default admin user
  const { hashPassword } = await import('../src/lib/auth')
  await prisma.user.upsert({
    where: { email: 'admin@tunoteshub.com' },
    create: {
      name: 'Admin',
      email: 'admin@tunoteshub.com',
      password: await hashPassword('Admin@123'),
      role: 'ADMIN',
      isEmailVerified: true,
      packageType: 'ELITE_AI',
    },
    update: {},
  })
  console.log('✅ Admin user: admin@tunoteshub.com / Admin@123')

  // Create default student user (BCA 5th Semester)
  await prisma.user.upsert({
    where: { email: 'student@tunoteshub.com' },
    create: {
      name: 'Demo Student',
      email: 'student@tunoteshub.com',
      password: await hashPassword('Student@123'),
      role: 'STUDENT',
      isEmailVerified: true,
      packageType: 'ELITE_AI', // Let's make the demo student ELITE_AI so they can access the predictions out-of-the-box
      facultyId: 'bca',
      semesterOrder: 5,
    },
    update: {
      packageType: 'ELITE_AI',
      facultyId: 'bca',
      semesterOrder: 5,
    },
  })
  console.log('✅ Student user: student@tunoteshub.com / Student@123 (BCA 5th Sem, Elite AI)')

  // Seed sample content for BCA 5th Sem Dot Net Technology
  const dotNetSub = await prisma.subject.findFirst({
    where: { code: 'CACS302' }
  })

  if (dotNetSub) {
    // Past papers
    await prisma.pastPaper.upsert({
      where: { id: 'sample-dotnet-2021' },
      create: {
        id: 'sample-dotnet-2021',
        year: 2021,
        examType: 'BOARD_EXAM',
        cloudinaryUrl: 'https://res.cloudinary.com/demo/image/upload/v12345/dotnet_2021.pdf',
        subjectId: dotNetSub.id,
        extractedText: `Tribhuvan University 2021 Bachelor in Computer Application (BCA) Fifth Semester Dot Net Technology. Answer all questions. Group A: 1. Explain the architecture of .NET framework. 2. What is CLR and CTS? 3. Describe ASP.NET page life cycle. 4. Discuss ADO.NET objects. 5. Write a program to connect to SQL database using C#.`
      },
      update: {}
    })

    await prisma.pastPaper.upsert({
      where: { id: 'sample-dotnet-2022' },
      create: {
        id: 'sample-dotnet-2022',
        year: 2022,
        examType: 'BOARD_EXAM',
        cloudinaryUrl: 'https://res.cloudinary.com/demo/image/upload/v12345/dotnet_2022.pdf',
        subjectId: dotNetSub.id,
        extractedText: `Tribhuvan University 2022 Bachelor in Computer Application (BCA) Fifth Semester Dot Net Technology. Group A: 1. Differentiate between ASP.NET WebForms and ASP.NET MVC. 2. Explain delegates and events in C#. 3. Explain the importance of assembly in .NET. 4. Write C# code to upload files. 5. Discuss Entity Framework code first approach.`
      },
      update: {}
    })

    await prisma.pastPaper.upsert({
      where: { id: 'sample-dotnet-2023' },
      create: {
        id: 'sample-dotnet-2023',
        year: 2023,
        examType: 'BOARD_EXAM',
        cloudinaryUrl: 'https://res.cloudinary.com/demo/image/upload/v12345/dotnet_2023.pdf',
        subjectId: dotNetSub.id,
        extractedText: `Tribhuvan University 2023 Bachelor in Computer Application (BCA) Fifth Semester Dot Net Technology. Answer all questions. 1. What is delegates? Explain its types. 2. Explain ASP.NET Core middleware and routing. 3. How to use LINQ queries? 4. Write a program using ADO.NET to update student marks.`
      },
      update: {}
    })

    // Study note
    await prisma.note.upsert({
      where: { id: 'sample-dotnet-notes' },
      create: {
        id: 'sample-dotnet-notes',
        title: 'Dot Net Technology Complete Lecture Notes',
        description: 'Complete syllabus handwritten/compiled notes covering C# basics, Windows Forms, ADO.NET, ASP.NET MVC, and Entity Framework.',
        cloudinaryUrl: 'https://res.cloudinary.com/demo/image/upload/v12345/dotnet_notes.pdf',
        noteType: 'SHORT_NOTES',
        isPremium: false,
        author: 'Er. Ramesh Shrestha',
        subjectId: dotNetSub.id,
        downloadCount: 42
      },
      update: {}
    })
    
    // Cheatsheet
    await prisma.cheatsheet.upsert({
      where: { id: 'sample-dotnet-cheatsheet' },
      create: {
        id: 'sample-dotnet-cheatsheet',
        title: 'Dot Net Quick Reference Cheatsheet',
        content: '# Dot Net Quick Reference\n- **CLR**: Common Language Runtime manages execution.\n- **CTS**: Common Type System defines data types.\n- **Delegates**: Type-safe function pointers.\n- **LINQ**: Language Integrated Query.\n- **ADO.NET Objects**: Connection, Command, DataReader, DataAdapter, DataSet.',
        subjectId: dotNetSub.id
      },
      update: {}
    })
    
    console.log('✅ Seeded sample Dot Net materials for BCA 5th Sem!')
  }
  
  console.log('\n🎉 Database seeded successfully!')
}

main().catch(console.error).finally(() => prisma.$disconnect())
