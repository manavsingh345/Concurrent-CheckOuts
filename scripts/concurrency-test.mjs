const appUrl = process.argv[2] ?? "http://localhost:3000";
const inventoryId = process.argv[3];
const quantity = Number(process.argv[4] ?? "1");
const attempts = Number(process.argv[5] ?? "50");

if (!inventoryId) {
  console.error(
    "Usage: node scripts/concurrency-test.mjs <appUrl> <inventoryId> [quantity] [attempts]",
  );
  process.exit(1);
}

const requests = Array.from({ length: attempts }, (_, index) =>
  fetch(`${appUrl}/api/reservations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": `concurrency-${index}-${Date.now()}`,
    },
    body: JSON.stringify({
      inventoryId,
      quantity,
    }),
  }).then(async (response) => ({
    status: response.status,
    body: await response.json().catch(() => null),
  })),
);

const results = await Promise.all(requests);
const successCount = results.filter((result) => result.status === 201).length;
const conflictCount = results.filter((result) => result.status === 409).length;

console.log(
  JSON.stringify(
    {
      attempts,
      successCount,
      conflictCount,
      otherStatuses: results
        .filter((result) => ![201, 409].includes(result.status))
        .map((result) => result.status),
    },
    null,
    2,
  ),
);
