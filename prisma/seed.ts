// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import faculties from '../data/faculties.json'

const prisma = new PrismaClient()

// Core subject mapping to seed realistic syllabus
const subjectsMap: Record<string, { semester: number; code: string; title: string }[]> = {
  bca: [
    // --- NEW SYLLABUS ---
    // Sem 1 (New)
    { semester: 1, code: "BCA 101", title: "Computer Fundamentals and Applications (New Syllabus)" },
    { semester: 1, code: "BCA 102", title: "Programming in C (New Syllabus)" },
    { semester: 1, code: "BCA 103", title: "Digital Logic (New Syllabus)" },
    { semester: 1, code: "BCA 104", title: "Mathematics-I (New Syllabus)" },
    { semester: 1, code: "BCA 105", title: "Professional Communication and Ethics (New Syllabus)" },
    { semester: 1, code: "BCA 106", title: "Hardware Workshop (New Syllabus)" },

    // Sem 2 (New)
    { semester: 2, code: "BCA 151", title: "Discrete Structure (New Syllabus)" },
    { semester: 2, code: "BCA 152", title: "Microprocessor and Computer Architecture (New Syllabus)" },
    { semester: 2, code: "BCA 153", title: "OOP in Java (New Syllabus)" },
    { semester: 2, code: "BCA 154", title: "Mathematics-II (New Syllabus)" },
    { semester: 2, code: "BCA 155", title: "UX/UI Design (New Syllabus)" },
    { semester: 2, code: "BCA 156", title: "Principle of Management (New Syllabus)" },

    // Sem 3 (New)
    { semester: 3, code: "BCA 201", title: "Data Structure and Algorithms (New Syllabus)" },
    { semester: 3, code: "BCA 202", title: "Database Management System (New Syllabus)" },
    { semester: 3, code: "BCA 203", title: "Web Technology-I (New Syllabus)" },
    { semester: 3, code: "BCA 204", title: "System Analysis and Design (New Syllabus)" },
    { semester: 3, code: "BCA 205", title: "Probability and Statistics (New Syllabus)" },
    { semester: 3, code: "BCA 206", title: "Applied Economics (New Syllabus)" },

    // Sem 4 (New)
    { semester: 4, code: "BCA 251", title: "Operating Systems (New Syllabus)" },
    { semester: 4, code: "BCA 252", title: "Software Engineering (New Syllabus)" },
    { semester: 4, code: "BCA 253", title: "Numerical Methods (New Syllabus)" },
    { semester: 4, code: "BCA 254", title: "Python Programming (New Syllabus)" },
    { semester: 4, code: "BCA 255", title: "Web Technology-II (New Syllabus)" },
    { semester: 4, code: "BCA 256", title: "Project-I (New Syllabus)" },

    // Sem 5 (New)
    { semester: 5, code: "BCA 301", title: "Computer Network (New Syllabus)" },
    { semester: 5, code: "BCA 302", title: "Artificial Intelligence (New Syllabus)" },
    { semester: 5, code: "BCA 303", title: "Advance Java Programming (New Syllabus)" },
    { semester: 5, code: "BCA 304", title: "MIS and e-Business (New Syllabus)" },
    { semester: 5, code: "BCA 305", title: "Society and Technology (New Syllabus)" },
    { semester: 5, code: "BCA 306", title: "Project-II (New Syllabus)" },

    // Sem 6 (New)
    { semester: 6, code: "BCA 351", title: "Computer Graphics and Animation (New Syllabus)" },
    { semester: 6, code: "BCA 352", title: "Mobile Programming (New Syllabus)" },
    { semester: 6, code: "BCA 353", title: "Cryptography and Network Security (New Syllabus)" },
    { semester: 6, code: "BCA 354", title: "Technical Writing (New Syllabus)" },
    { semester: 6, code: "BCA 355", title: "Distributed System (New Syllabus)" },
    { semester: 6, code: "BCA 356", title: "Project-III (New Syllabus)" },

    // Sem 7 (New)
    { semester: 7, code: "BCA 401", title: "Cyber Security and Ethical Hacking (New Syllabus)" },
    { semester: 7, code: "BCA 402", title: "Software Project Management (New Syllabus)" },
    { semester: 7, code: "BCA 403", title: "Financial Accounting (New Syllabus)" },
    { semester: 7, code: "BCA 404", title: "Project-IV (New Syllabus)" },
    { semester: 7, code: "BCA 405-I", title: "Machine Learning (Elective-I)" },
    { semester: 7, code: "BCA 405-II", title: "E-Commerce (Elective-I)" },
    { semester: 7, code: "BCA 405-III", title: "Database Administration (Elective-I)" },
    { semester: 7, code: "BCA 405-IV", title: "Linux (Elective-I)" },
    { semester: 7, code: "BCA 406-I", title: "Dotnet Technology (Elective-II)" },
    { semester: 7, code: "BCA 406-II", title: "Business Intelligence (Elective-II)" },
    { semester: 7, code: "BCA 406-III", title: "Software Testing and QA (Elective-II)" },
    { semester: 7, code: "BCA 406-IV", title: "Data Visualization (Elective-II)" },

    // Sem 8 (New)
    { semester: 8, code: "BCA 451", title: "Cloud Computing (New Syllabus)" },
    { semester: 8, code: "BCA 452", title: "Internship (New Syllabus)" },
    { semester: 8, code: "BCA 453-I", title: "Network Administration (Elective-III)" },
    { semester: 8, code: "BCA 453-II", title: "E-Governance (Elective-III)" },
    { semester: 8, code: "BCA 453-III", title: "Database Programming (Elective-III)" },
    { semester: 8, code: "BCA 453-IV", title: "Geographical Information System (Elective-III)" },
    { semester: 8, code: "BCA 454-I", title: "Digital Marketing and SEO (Elective-IV)" },
    { semester: 8, code: "BCA 454-IV", title: "Data Mining and Data Warehouse (Elective-IV)" },

    // --- OLD SYLLABUS ---
    // Sem 1 (Old)
    { semester: 1, code: "CACS101", title: "Computer Fundamentals and Applications (Old Syllabus)" },
    { semester: 1, code: "CASO102", title: "Society and Technology (Old Syllabus)" },
    { semester: 1, code: "CAEN103", title: "English I (Old Syllabus)" },
    { semester: 1, code: "CAMT104", title: "Mathematics I (Old Syllabus)" },
    { semester: 1, code: "CACS105", title: "Digital Logic (Old Syllabus)" },

    // Sem 2 (Old)
    { semester: 2, code: "CACS151", title: "C Programming (Old Syllabus)" },
    { semester: 2, code: "CAAC152", title: "Financial Accounting (Old Syllabus)" },
    { semester: 2, code: "CAEN153", title: "English II (Old Syllabus)" },
    { semester: 2, code: "CAMT154", title: "Mathematics II (Old Syllabus)" },
    { semester: 2, code: "CACS155", title: "Microprocessor & Computer Architecture (Old Syllabus)" },

    // Sem 3 (Old)
    { semester: 3, code: "CACS201", title: "Data Structures and Algorithms (Old Syllabus)" },
    { semester: 3, code: "CAST202", title: "Probability and Statistics (Old Syllabus)" },
    { semester: 3, code: "CACS203", title: "System Analysis and Design (Old Syllabus)" },
    { semester: 3, code: "CACS204", title: "OOP in Java (Old Syllabus)" },
    { semester: 3, code: "CACS205", title: "Web Technology (Old Syllabus)" },

    // Sem 4 (Old)
    { semester: 4, code: "CACS251", title: "Operating System (Old Syllabus)" },
    { semester: 4, code: "CAMT252", title: "Numerical Methods (Old Syllabus)" },
    { semester: 4, code: "CACS253", title: "Software Engineering (Old Syllabus)" },
    { semester: 4, code: "CACS254", title: "Scripting Language (Old Syllabus)" },
    { semester: 4, code: "CACS255", title: "Database Management System (Old Syllabus)" },
    { semester: 4, code: "CAPJ256", title: "Project I (Old Syllabus)" },

    // Sem 5 (Old)
    { semester: 5, code: "CACS301", title: "MIS and e-Business (Old Syllabus)" },
    { semester: 5, code: "CACS302", title: "DotNet Technology (Old Syllabus)" },
    { semester: 5, code: "CACS303", title: "Computer Networking (Old Syllabus)" },
    { semester: 5, code: "CAMG304", title: "Introduction to Management (Old Syllabus)" },
    { semester: 5, code: "CACS305", title: "Computer Graphics and Animation (Old Syllabus)" },

    // Sem 6 (Old)
    { semester: 6, code: "CACS351", title: "Mobile Programming (Old Syllabus)" },
    { semester: 6, code: "CACS352", title: "Distributed System (Old Syllabus)" },
    { semester: 6, code: "CAEC353", title: "Applied Economics (Old Syllabus)" },
    { semester: 6, code: "CACS354", title: "Advanced Java Programming (Old Syllabus)" },
    { semester: 6, code: "CACS355", title: "Network Programming (Old Syllabus)" },
    { semester: 6, code: "CAPJ356", title: "Project II (Old Syllabus)" },

    // Sem 7 (Old)
    { semester: 7, code: "CACS401", title: "Cyber Law and Professional Ethics (Old Syllabus)" },
    { semester: 7, code: "CACS402", title: "Cloud Computing (Old Syllabus)" },
    { semester: 7, code: "CAIN403", title: "Internship (Old Syllabus)" },
    { semester: 7, code: "CACS404", title: "Elective I (Image Processing / DBA / Network Security) (Old)" },
    { semester: 7, code: "CACS405", title: "Elective II (Adv DotNet / E-Gov / AI) (Old)" },

    // Sem 8 (Old)
    { semester: 8, code: "CAOR451", title: "Operations Research (Old Syllabus)" },
    { semester: 8, code: "CAPJ452", title: "Project III (Old Syllabus)" },
    { semester: 8, code: "CACS453", title: "Elective III (Data Mining / Wireless / GIS) (Old)" },
    { semester: 8, code: "CACS454", title: "Elective IV (Knowledge Mgmt / Testing / Adv Web) (Old)" },
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
