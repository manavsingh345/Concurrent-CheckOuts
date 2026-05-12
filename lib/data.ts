import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const reservationInclude = {
  inventory: {
    include: {
      product: true,
      warehouse: true,
    },
  },
} as const;

type ReservationRecord = Prisma.ReservationGetPayload<{
  include: typeof reservationInclude;
}>;

export type ProductListItem = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  totalAvailableStock: number;
  inventories: {
    inventoryId: string;
    warehouseId: string;
    warehouseName: string;
    warehouseLocation: string;
    totalStock: number;
    reservedStock: number;
    availableStock: number;
  }[];
};

export type ProductDetail = ProductListItem;

export type WarehouseListItem = {
  id: string;
  name: string;
  location: string;
};

export type ReservationView = {
  id: string;
  quantity: number;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "EXPIRED";
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  idempotencyKey: string | null;
  inventory: {
    id: string;
    totalStock: number;
    reservedStock: number;
    availableStock: number;
    product: {
      id: string;
      name: string;
      description: string | null;
      price: number;
    };
    warehouse: {
      id: string;
      name: string;
      location: string;
    };
  };
};

function mapReservation(reservation: ReservationRecord): ReservationView {
  return {
    id: reservation.id,
    quantity: reservation.quantity,
    status: reservation.status,
    expiresAt: reservation.expiresAt.toISOString(),
    createdAt: reservation.createdAt.toISOString(),
    updatedAt: reservation.updatedAt.toISOString(),
    idempotencyKey: reservation.idempotencyKey,
    inventory: {
      id: reservation.inventory.id,
      totalStock: reservation.inventory.totalStock,
      reservedStock: reservation.inventory.reservedStock,
      availableStock:
        reservation.inventory.totalStock - reservation.inventory.reservedStock,
      product: {
        id: reservation.inventory.product.id,
        name: reservation.inventory.product.name,
        description: reservation.inventory.product.description,
        price: reservation.inventory.product.price,
      },
      warehouse: {
        id: reservation.inventory.warehouse.id,
        name: reservation.inventory.warehouse.name,
        location: reservation.inventory.warehouse.location,
      },
    },
  };
}

export async function listProducts(): Promise<ProductListItem[]> {
  const products = await prisma.product.findMany({
    orderBy: {
      name: "asc",
    },
    include: {
      inventories: {
        include: {
          warehouse: true,
        },
        orderBy: {
          warehouse: {
            name: "asc",
          },
        },
      },
    },
  });

  return products.map((product) => {
    const inventories = product.inventories.map((inventory) => ({
      inventoryId: inventory.id,
      warehouseId: inventory.warehouseId,
      warehouseName: inventory.warehouse.name,
      warehouseLocation: inventory.warehouse.location,
      totalStock: inventory.totalStock,
      reservedStock: inventory.reservedStock,
      availableStock: inventory.totalStock - inventory.reservedStock,
    }));

    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      totalAvailableStock: inventories.reduce(
        (sum, inventory) => sum + inventory.availableStock,
        0,
      ),
      inventories,
    };
  });
}

export async function getProductById(id: string): Promise<ProductDetail | null> {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      inventories: {
        include: {
          warehouse: true,
        },
        orderBy: {
          warehouse: {
            name: "asc",
          },
        },
      },
    },
  });

  if (!product) {
    return null;
  }

  const inventories = product.inventories.map((inventory) => ({
    inventoryId: inventory.id,
    warehouseId: inventory.warehouseId,
    warehouseName: inventory.warehouse.name,
    warehouseLocation: inventory.warehouse.location,
    totalStock: inventory.totalStock,
    reservedStock: inventory.reservedStock,
    availableStock: inventory.totalStock - inventory.reservedStock,
  }));

  return {
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    totalAvailableStock: inventories.reduce(
      (sum, inventory) => sum + inventory.availableStock,
      0,
    ),
    inventories,
  };
}

export async function listWarehouses(): Promise<WarehouseListItem[]> {
  const warehouses = await prisma.warehouse.findMany({
    orderBy: {
      name: "asc",
    },
  });

  return warehouses.map((warehouse) => ({
    id: warehouse.id,
    name: warehouse.name,
    location: warehouse.location,
  }));
}

export async function getReservationById(id: string) {
  const reservation = await prisma.reservation.findUnique({
    where: { id },
    include: reservationInclude,
  });

  return reservation ? mapReservation(reservation) : null;
}
