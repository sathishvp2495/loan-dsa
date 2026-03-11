import { Router } from "express";
import { prisma } from "../../lib/prisma.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { requireAuth } from "../../middlewares/require-auth.js";

const router = Router();

router.get(
  "/summary",
  requireAuth,
  asyncHandler(async (_req, res) => {
    const [totalLeads, stageGroups, requestedAmountAgg, commissionsAgg, recentLeads] = await Promise.all([
      prisma.lead.count(),
      prisma.lead.groupBy({
        by: ["stage"],
        _count: {
          _all: true
        }
      }),
      prisma.lead.aggregate({
        _sum: {
          requestedAmount: true
        }
      }),
      prisma.commission.aggregate({
        _sum: {
          disbursedAmount: true,
          partnerShareAmount: true
        }
      }),
      prisma.lead.findMany({
        orderBy: {
          createdAt: "desc"
        },
        take: 5,
        select: {
          id: true,
          referenceCode: true,
          fullName: true,
          phone: true,
          stage: true,
          requestedAmount: true,
          city: true,
          createdAt: true
        }
      })
    ]);

    const stageCounts = stageGroups.reduce<Record<string, number>>((acc, item) => {
      acc[item.stage] = item._count._all;
      return acc;
    }, {});

    return res.json({
      totalLeads,
      stageCounts,
      totalRequestedAmount: requestedAmountAgg._sum.requestedAmount ?? 0,
      totalDisbursedAmount: Number(commissionsAgg._sum.disbursedAmount ?? 0),
      totalPartnerPayout: Number(commissionsAgg._sum.partnerShareAmount ?? 0),
      recentLeads
    });
  })
);

export const dashboardRouter = router;
