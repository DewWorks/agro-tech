import prisma from '../src/lib/prisma'

async function main() {
  const email = 'joaovictorpfr@gmail.com'
  
  const user = await prisma.user.findUnique({
    where: { email }
  })

  if (!user) {
    console.log(`User ${email} not found.`)
    process.exit(1)
  }

  await prisma.user.update({
    where: { email },
    data: {
      role: 'SUPER_ADMIN',
      organizationId: null
    }
  })

  console.log(`User ${email} elevated to SUPER_ADMIN successfully.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
