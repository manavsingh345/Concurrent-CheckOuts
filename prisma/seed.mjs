import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.reservation.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.product.deleteMany();
  await prisma.warehouse.deleteMany();

  const [northHub, southHub] = await prisma.$transaction([
    prisma.warehouse.create({
      data: {
        name: "North Hub",
        location: "Delhi NCR",
      },
    }),
    prisma.warehouse.create({
      data: {
        name: "South Hub",
        location: "Bengaluru",
      },
    }),
  ]);

  const [gummies, monitor, sleepKit, diffuser] = await prisma.$transaction([
    prisma.product.create({
      data: {
        name: "Performance Gummies",
        description: "Daily wellness gummies for energy, routine, and repeat orders.",
        price: 899,
      },
    }),
    prisma.product.create({
      data: {
        name: "Smart Cycle Monitor",
        description: "A connected health device with premium packaging and live warehouse fulfillment.",
        price: 4299,
      },
    }),
    prisma.product.create({
      data: {
        name: "Sleep Recovery Kit",
        description: "A bundled rest-and-recovery starter kit designed for repeat care journeys.",
        price: 2499,
      },
    }),
    prisma.product.create({
      data: {
        name: "Wellness Diffuser",
        description: "A home-care diffuser merchandised like a premium D2C accessory.",
        price: 1899,
      },
    }),
  ]);

  await prisma.inventory.createMany({
    data: [
      {
        productId: gummies.id,
        warehouseId: northHub.id,
        totalStock: 24,
        reservedStock: 0,
      },
      {
        productId: gummies.id,
        warehouseId: southHub.id,
        totalStock: 18,
        reservedStock: 0,
      },
      {
        productId: monitor.id,
        warehouseId: northHub.id,
        totalStock: 9,
        reservedStock: 0,
      },
      {
        productId: monitor.id,
        warehouseId: southHub.id,
        totalStock: 6,
        reservedStock: 0,
      },
      {
        productId: sleepKit.id,
        warehouseId: northHub.id,
        totalStock: 14,
        reservedStock: 0,
      },
      {
        productId: sleepKit.id,
        warehouseId: southHub.id,
        totalStock: 11,
        reservedStock: 0,
      },
      {
        productId: diffuser.id,
        warehouseId: northHub.id,
        totalStock: 12,
        reservedStock: 0,
      },
      {
        productId: diffuser.id,
        warehouseId: southHub.id,
        totalStock: 8,
        reservedStock: 0,
      },
    ],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
