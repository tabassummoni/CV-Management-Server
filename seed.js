import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Global Attribute Library...');
  
  await prisma.attribute.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.position.deleteMany({});
  console.log('🧹 Cleaned up old seed data.');

  const techCategory = await prisma.category.create({
    data: { name: 'Technical Skills' }
  });

  await prisma.attribute.createMany({
    data: [
      { name: 'React Experience (Years)', dataType: 'NUMBER', categoryId: techCategory.id },
      { name: 'Tailwind CSS Mastery', dataType: 'BOOLEAN', categoryId: techCategory.id },
      { name: 'Node.js Knowledge', dataType: 'BOOLEAN', categoryId: techCategory.id },
      { name: 'System Architecture', dataType: 'TEXT', categoryId: techCategory.id },
      { name: 'Database Design (PostgreSQL)', dataType: 'BOOLEAN', categoryId: techCategory.id },
      { name: 'Prisma ORM Proficiency', dataType: 'BOOLEAN', categoryId: techCategory.id },
    ]
  });
  console.log('✅ Technical Attributes Seeded.');

  const softSkillsCategory = await prisma.category.create({
    data: { name: 'Soft Skills' }
  });

  await prisma.attribute.createMany({
    data: [
      { name: 'Communication Level', dataType: 'TEXT', categoryId: softSkillsCategory.id },
      { name: 'Teamwork Collaboration', dataType: 'BOOLEAN', categoryId: softSkillsCategory.id },
    ]
  });
  console.log('✅ Soft Skill Attributes Seeded.');

  await prisma.position.createMany({
    data: [
      { id: 1, title: 'Frontend Developer Template', description: 'Default template for frontend roles.', maxProjects: 3, projectTags: ['React', 'Vite', 'Tailwind CSS'] },
      { id: 2, title: 'Fullstack Developer Template', description: 'Default template for fullstack roles.', maxProjects: 4, projectTags: ['Node.js', 'Express', 'Prisma'] },
      { id: 3, title: 'React Native Mobile Dev Template', description: 'Default template for mobile dev roles.', maxProjects: 3, projectTags: ['React Native', 'Expo'] },
      { id: 4, title: 'Backend Developer Template', description: 'Default template for backend roles.', maxProjects: 3, projectTags: ['Node.js', 'PostgreSQL'] },
    ],
    skipDuplicates: true,
  });
  console.log('✅ Default Positions Seeded.');

}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });