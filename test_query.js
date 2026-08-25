const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.pastPaper.findFirst({where: {}}).then(res => {
  console.log(res);
  process.exit(0);
});
