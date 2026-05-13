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

  const [
    gummies,
    monitor,
    sleepKit,
    diffuser,
    hydration,
    massager,
    probiotic,
    aromatherapy,
    thermos,
    posture,
  ] = await prisma.$transaction([
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
    prisma.product.create({
      data: {
        name: "Hydration Support Tablets",
        description: "Electrolyte tablets built for recovery, travel, and daily hydration routines.",
        price: 699,
      },
    }),
    prisma.product.create({
      data: {
        name: "Smart Pulse Massager",
        description: "A compact recovery device designed for post-workout care and evening relaxation.",
        price: 3299,
      },
    }),
    prisma.product.create({
      data: {
        name: "Gut Balance Probiotic",
        description: "A daily digestive support formula for routine wellness and long-term replenishment.",
        price: 1199,
      },
    }),
    prisma.product.create({
      data: {
        name: "Aromatherapy Sleep Mist",
        description: "A bedside calming spray with a softer home-care presentation and quick reorder appeal.",
        price: 999,
      },
    }),
    prisma.product.create({
      data: {
        name: "Thermal Recovery Bottle",
        description: "An insulated daily-use bottle merchandised as a premium wellness accessory.",
        price: 1499,
      },
    }),
    prisma.product.create({
      data: {
        name: "Posture Relief Wrap",
        description: "A lightweight support wrap positioned as a comfort and recovery essential.",
        price: 1599,
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
      {
        productId: hydration.id,
        warehouseId: northHub.id,
        totalStock: 28,
        reservedStock: 0,
      },
      {
        productId: hydration.id,
        warehouseId: southHub.id,
        totalStock: 21,
        reservedStock: 0,
      },
      {
        productId: massager.id,
        warehouseId: northHub.id,
        totalStock: 7,
        reservedStock: 0,
      },
      {
        productId: massager.id,
        warehouseId: southHub.id,
        totalStock: 5,
        reservedStock: 0,
      },
      {
        productId: probiotic.id,
        warehouseId: northHub.id,
        totalStock: 19,
        reservedStock: 0,
      },
      {
        productId: probiotic.id,
        warehouseId: southHub.id,
        totalStock: 16,
        reservedStock: 0,
      },
      {
        productId: aromatherapy.id,
        warehouseId: northHub.id,
        totalStock: 13,
        reservedStock: 0,
      },
      {
        productId: aromatherapy.id,
        warehouseId: southHub.id,
        totalStock: 10,
        reservedStock: 0,
      },
      {
        productId: thermos.id,
        warehouseId: northHub.id,
        totalStock: 17,
        reservedStock: 0,
      },
      {
        productId: thermos.id,
        warehouseId: southHub.id,
        totalStock: 12,
        reservedStock: 0,
      },
      {
        productId: posture.id,
        warehouseId: northHub.id,
        totalStock: 15,
        reservedStock: 0,
      },
      {
        productId: posture.id,
        warehouseId: southHub.id,
        totalStock: 11,
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
