const { PrismaClient } =  require('@prisma/client');
const prisma = new PrismaClient()
async function main() {
  const users = await prisma.user.findMany();
  if(users.length > 0) return;
  await prisma.user.createMany({
    data:[
        {
            name:"arun",
            email:"arun@gmail.com"
        },
        {
            name:"amal",
            email:"amal@gmail.com"
        }
    ]
  });
  console.log("Database seeding success");
}

main();