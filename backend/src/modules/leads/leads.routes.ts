import { Router } from "express";
import { asyncHandler } from "../../utils/async-handler.js";
import { requireAuth } from "../../middlewares/require-auth.js";
import {
  addNoteSchema,
  assignLeadSchema,
  commissionSchema,
  internalLeadSchema,
  leadListQuerySchema,
  publicLeadSchema,
  updateStageSchema,
  whatsappSendSchema
} from "./lead.schemas.js";
import {
  addLeadNote,
  assignLead,
  createPublicLead,
  getLeadById,
  listLeads,
  sendManualWhatsappMessage,
  updateLeadStage,
  upsertCommission
} from "./leads.service.js";

const router = Router();

router.post(
  "/public",
  asyncHandler(async (req, res) => {
    const payload = publicLeadSchema.parse(req.body);
    const lead = await createPublicLead(payload);

    return res.status(201).json({
      message: "Lead created successfully",
      lead
    });
  })
);

router.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const filters = leadListQuerySchema.parse(req.query);
    const leads = await listLeads(filters);

    return res.json({ leads });
  })
);

router.post(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const payload = internalLeadSchema.parse(req.body);
    const lead = await createPublicLead(payload, payload.assignedAgentId);

    return res.status(201).json({
      message: "Lead created successfully",
      lead
    });
  })
);

router.get(
  "/:leadId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const lead = await getLeadById(req.params.leadId);

    return res.json({ lead });
  })
);

router.patch(
  "/:leadId/stage",
  requireAuth,
  asyncHandler(async (req, res) => {
    const payload = updateStageSchema.parse(req.body);
    const lead = await updateLeadStage({
      leadId: req.params.leadId,
      stage: payload.stage,
      reason: payload.reason,
      changedById: req.user?.userId
    });

    return res.json({
      message: "Lead stage updated",
      lead
    });
  })
);

router.patch(
  "/:leadId/assign",
  requireAuth,
  asyncHandler(async (req, res) => {
    const payload = assignLeadSchema.parse(req.body);
    const lead = await assignLead(req.params.leadId, payload.assignedAgentId, req.user?.userId);

    return res.json({
      message: "Lead assignment updated",
      lead
    });
  })
);

router.post(
  "/:leadId/notes",
  requireAuth,
  asyncHandler(async (req, res) => {
    const payload = addNoteSchema.parse(req.body);
    const lead = await addLeadNote(req.params.leadId, payload.body, req.user?.userId);

    return res.status(201).json({
      message: "Note added",
      lead
    });
  })
);

router.put(
  "/:leadId/commission",
  requireAuth,
  asyncHandler(async (req, res) => {
    const payload = commissionSchema.parse(req.body);
    const lead = await upsertCommission(req.params.leadId, payload);

    return res.json({
      message: "Commission saved",
      lead
    });
  })
);

router.post(
  "/:leadId/whatsapp/send",
  requireAuth,
  asyncHandler(async (req, res) => {
    const payload = whatsappSendSchema.parse(req.body);
    const result = await sendManualWhatsappMessage(req.params.leadId, payload);

    return res.status(201).json({
      message: "WhatsApp request processed",
      ...result
    });
  })
);

export const leadsRouter = router;
