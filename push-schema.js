// push-schema.js
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('Adding missing subject mapping columns to database...')

  const columns = [
    { name: 'linkedSubjectId', type: 'VARCHAR(191) NULL' },
    { name: 'linkIncludeNotes', type: 'TINYINT(1) NOT NULL DEFAULT 1' },
    { name: 'linkIncludeLabWork', type: 'TINYINT(1) NOT NULL DEFAULT 1' },
    { name: 'linkIncludeProjectWork', type: 'TINYINT(1) NOT NULL DEFAULT 1' },
    { name: 'linkIncludeProjects', type: 'TINYINT(1) NOT NULL DEFAULT 1' },
    { name: 'linkIncludeGuides', type: 'TINYINT(1) NOT NULL DEFAULT 1' },
    { name: 'linkIncludeSyllabus', type: 'TINYINT(1) NOT NULL DEFAULT 1' },
    { name: 'linkIncludePastPapers', type: 'TINYINT(1) NOT NULL DEFAULT 1' },
    { name: 'linkIncludeMCQs', type: 'TINYINT(1) NOT NULL DEFAULT 1' },
    { name: 'linkIncludeBooks', type: 'TINYINT(1) NOT NULL DEFAULT 1' },
    { name: 'linkIncludeCheatsheets', type: 'TINYINT(1) NOT NULL DEFAULT 1' },
  ]

  for (const col of columns) {
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE \`Subject\` ADD COLUMN \`${col.name}\` ${col.type}`)
      console.log(`✓ Added column: ${col.name}`)
    } catch (err) {
      if (err.message && (err.message.includes('Duplicate column name') || err.message.includes('already exists'))) {
        console.log(`- Column ${col.name} already exists.`)
      } else {
        console.error(`! Error adding ${col.name}:`, err.message)
      }
    }
  }

  // Add foreign key constraint for linkedSubjectId if not exists
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE \`Subject\`
      ADD CONSTRAINT \`Subject_linkedSubjectId_fkey\`
      FOREIGN KEY (\`linkedSubjectId\`) REFERENCES \`Subject\`(\`id\`)
      ON DELETE SET NULL ON UPDATE CASCADE
    `)
    console.log('✓ Foreign key constraint added.')
  } catch (err) {
    console.log('- Foreign key constraint skipped or already exists.')
  }

  console.log('Database migration completed successfully!')
  await prisma.$disconnect()
}

main().catch(async (e) => {
  console.error(e)
  await prisma.$disconnect()
  process.exit(1)
})
