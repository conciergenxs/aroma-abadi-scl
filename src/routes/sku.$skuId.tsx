import { createFileRoute, redirect } from "@tanstack/react-router";

// This file is kept as a redirect shim — the actual page lives in sku-detail.$skuId.tsx
export const Route = createFileRoute("/sku/$skuId")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/sku-detail/$skuId", params: { skuId: params.skuId }, replace: true });
  },
  component: () => null,
});
