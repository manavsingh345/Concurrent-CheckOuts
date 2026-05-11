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

  const [headphones, keyboard, speaker] = await prisma.$transaction([
    prisma.product.create({
      data: {
        name: "Studio Headphones",
        description: "Closed-back headphones for checkout race-condition demos.",
        price: 149.99,
      },
    }),
    prisma.product.create({
      data: {
        name: "Mechanical Keyboard",
        description: "Compact keyboard with just enough stock to stress test reservations.",
        price: 129.0,
      },
    }),
    prisma.product.create({
      data: {
        name: "Portable Speaker",
        description: "Small speaker with stock split across warehouses.",
        price: 89.5,
      },
    }),
  ]);

  await prisma.inventory.createMany({
    data: [
      {
        productId: headphones.id,
        warehouseId: northHub.id,
        totalStock: 5,
        reservedStock: 0,
      },
      {
        productId: headphones.id,
        warehouseId: southHub.id,
        totalStock: 3,
        reservedStock: 0,
      },
      {
        productId: keyboard.id,
        warehouseId: northHub.id,
        totalStock: 8,
        reservedStock: 0,
      },
      {
        productId: keyboard.id,
        warehouseId: southHub.id,
        totalStock: 4,
        reservedStock: 0,
      },
      {
        productId: speaker.id,
        warehouseId: northHub.id,
        totalStock: 10,
        reservedStock: 0,
      },
      {
        productId: speaker.id,
        warehouseId: southHub.id,
        totalStock: 6,
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
