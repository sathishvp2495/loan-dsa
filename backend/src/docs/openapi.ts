export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "Loan DSA Backend API",
    version: "1.0.0",
    description:
      "API documentation for Loan DSA platform. Use the sample values in request bodies for quick backend testing."
  },
  servers: [
    {
      url: "http://localhost:4000",
      description: "Local development server"
    }
  ],
  tags: [
    { name: "Health" },
    { name: "Auth" },
    { name: "Dashboard" },
    { name: "Leads" },
    { name: "Users" },
    { name: "Webhooks" }
  ],
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Health check",
        responses: {
          "200": {
            description: "Server health status",
            content: {
              "application/json": {
                example: {
                  status: "ok",
                  environment: "development"
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login and get access token",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" },
              example: {
                email: "admin@loandsa.local",
                password: "Admin@12345"
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Login success",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LoginResponse" }
              }
            }
          },
          "401": {
            description: "Invalid credentials",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiError" }
              }
            }
          }
        }
      }
    },
    "/api/v1/dashboard/summary": {
      get: {
        tags: ["Dashboard"],
        summary: "Get dashboard summary",
        security: [{ BearerAuth: [] }],
        responses: {
          "200": {
            description: "Dashboard summary",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/DashboardSummaryResponse" }
              }
            }
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiError" }
              }
            }
          }
        }
      }
    },
    "/api/v1/users/agents": {
      get: {
        tags: ["Users"],
        summary: "List active agents and operations users",
        security: [{ BearerAuth: [] }],
        responses: {
          "200": {
            description: "Users list",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AgentsResponse" }
              }
            }
          }
        }
      }
    },
    "/api/v1/leads/public": {
      post: {
        tags: ["Leads"],
        summary: "Create public lead",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/PublicLeadRequest" },
              example: {
                fullName: "Perumal",
                phone: "9876543210",
                whatsappPhone: "",
                city: "Chennai",
                loanType: "CAR",
                employmentType: "SALARIED",
                monthlyIncome: 72000,
                requestedAmount: 200000,
                source: "WEBSITE",
                whatsappOptIn: true,
                notes: "Needs quick processing"
              }
            }
          }
        },
        responses: {
          "201": {
            description: "Lead created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LeadCreateResponse" }
              }
            }
          },
          "400": {
            description: "Validation error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiError" }
              }
            }
          }
        }
      }
    },
    "/api/v1/leads": {
      get: {
        tags: ["Leads"],
        summary: "List leads",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            in: "query",
            name: "stage",
            required: false,
            schema: { $ref: "#/components/schemas/LeadStage" }
          },
          {
            in: "query",
            name: "search",
            required: false,
            schema: { type: "string" },
            example: "LN-2026-03"
          },
          {
            in: "query",
            name: "assignedAgentId",
            required: false,
            schema: { type: "string", format: "uuid" }
          }
        ],
        responses: {
          "200": {
            description: "Lead list",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LeadListResponse" }
              }
            }
          }
        }
      },
      post: {
        tags: ["Leads"],
        summary: "Create internal lead",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/InternalLeadRequest" },
              example: {
                fullName: "Sivan",
                phone: "9876543210",
                whatsappPhone: "9876543210",
                city: "Madurai",
                loanType: "MORTGAGE",
                employmentType: "BUSINESS_OWNER",
                monthlyIncome: 180000,
                requestedAmount: 5000000,
                source: "MANUAL",
                whatsappOptIn: false,
                notes: "High priority",
                assignedAgentId: "3fa85f64-5717-4562-b3fc-2c963f66afa6"
              }
            }
          }
        },
        responses: {
          "201": {
            description: "Lead created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LeadCreateResponse" }
              }
            }
          }
        }
      }
    },
    "/api/v1/leads/{leadId}": {
      get: {
        tags: ["Leads"],
        summary: "Get lead by id",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "leadId",
            required: true,
            schema: { type: "string", format: "uuid" },
            example: "3fa85f64-5717-4562-b3fc-2c963f66afa6"
          }
        ],
        responses: {
          "200": {
            description: "Lead details",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LeadDetailResponse" }
              }
            }
          },
          "404": {
            description: "Lead not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiError" }
              }
            }
          }
        }
      }
    },
    "/api/v1/leads/{leadId}/stage": {
      patch: {
        tags: ["Leads"],
        summary: "Update lead stage",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "leadId",
            required: true,
            schema: { type: "string", format: "uuid" }
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateStageRequest" },
              example: {
                stage: "CONTACTED",
                reason: "Spoke with customer, requested documents"
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Stage updated",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LeadUpdateResponse" }
              }
            }
          }
        }
      }
    },
    "/api/v1/leads/{leadId}/assign": {
      patch: {
        tags: ["Leads"],
        summary: "Assign or clear lead agent",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "leadId",
            required: true,
            schema: { type: "string", format: "uuid" }
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AssignLeadRequest" },
              example: {
                assignedAgentId: "3fa85f64-5717-4562-b3fc-2c963f66afa6"
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Assignment updated",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LeadUpdateResponse" }
              }
            }
          }
        }
      }
    },
    "/api/v1/leads/{leadId}/notes": {
      post: {
        tags: ["Leads"],
        summary: "Add lead note",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "leadId",
            required: true,
            schema: { type: "string", format: "uuid" }
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AddLeadNoteRequest" },
              example: {
                body: "Customer shared salary slips and bank statement."
              }
            }
          }
        },
        responses: {
          "201": {
            description: "Note added",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LeadUpdateResponse" }
              }
            }
          }
        }
      }
    },
    "/api/v1/leads/{leadId}/commission": {
      put: {
        tags: ["Leads"],
        summary: "Create or update commission",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "leadId",
            required: true,
            schema: { type: "string", format: "uuid" }
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CommissionRequest" },
              example: {
                lenderName: "HDFC Bank",
                disbursedAmount: 1000000,
                payoutPercent: 4.5,
                addOnPercent: 2.5
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Commission saved",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LeadUpdateResponse" }
              }
            }
          }
        }
      }
    },
    "/api/v1/leads/{leadId}/whatsapp/send": {
      post: {
        tags: ["Leads"],
        summary: "Send manual WhatsApp text/template",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "leadId",
            required: true,
            schema: { type: "string", format: "uuid" }
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/WhatsappSendRequest" },
              examples: {
                textMessage: {
                  value: {
                    body: "Hi, your application is being processed."
                  }
                },
                templateMessage: {
                  value: {
                    templateSid: "HX1234567890abcdef",
                    templateVariables: {
                      "1": "Perumal",
                      "2": "LN-2026-03-003"
                    }
                  }
                }
              }
            }
          }
        },
        responses: {
          "201": {
            description: "WhatsApp request processed",
            content: {
              "application/json": {
                example: {
                  message: "WhatsApp request processed",
                  leadId: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
                  result: {
                    sid: "SMxxxxxxxxxxxxxxxxxxxx",
                    status: "queued"
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/webhooks/twilio/whatsapp": {
      post: {
        tags: ["Webhooks"],
        summary: "Twilio WhatsApp inbound webhook",
        requestBody: {
          required: true,
          content: {
            "application/x-www-form-urlencoded": {
              schema: {
                type: "object",
                properties: {
                  From: { type: "string", example: "whatsapp:+919876543210" },
                  To: { type: "string", example: "whatsapp:+14155238886" },
                  Body: { type: "string", example: "Hi, I need loan details" },
                  MessageSid: { type: "string", example: "SM1234567890abcdef" }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Twilio XML response",
            content: {
              "text/xml": {
                example: "<Response></Response>"
              }
            }
          }
        }
      }
    },
    "/api/v1/webhooks/twilio/status": {
      post: {
        tags: ["Webhooks"],
        summary: "Twilio WhatsApp status webhook",
        requestBody: {
          required: true,
          content: {
            "application/x-www-form-urlencoded": {
              schema: {
                type: "object",
                properties: {
                  MessageSid: { type: "string", example: "SM1234567890abcdef" },
                  MessageStatus: { type: "string", example: "delivered" },
                  From: { type: "string", example: "whatsapp:+14155238886" },
                  To: { type: "string", example: "whatsapp:+919876543210" }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Webhook accepted",
            content: {
              "application/json": {
                example: { received: true }
              }
            }
          }
        }
      }
    }
  },
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT"
      }
    },
    schemas: {
      ApiError: {
        type: "object",
        properties: {
          message: { type: "string", example: "Unauthorized" },
          details: { type: "object", nullable: true }
        }
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 8 }
        }
      },
      AuthUser: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          fullName: { type: "string" },
          email: { type: "string", format: "email" },
          role: { type: "string", enum: ["ADMIN", "AGENT", "OPERATIONS"] }
        }
      },
      LoginResponse: {
        type: "object",
        properties: {
          token: { type: "string" },
          user: { $ref: "#/components/schemas/AuthUser" }
        }
      },
      LoanType: {
        type: "string",
        enum: ["PERSONAL", "HOME", "BUSINESS", "MORTGAGE", "CAR", "EDUCATION", "GOLD"]
      },
      EmploymentType: {
        type: "string",
        enum: ["SALARIED", "SELF_EMPLOYED", "BUSINESS_OWNER", "OTHER"]
      },
      LeadSource: {
        type: "string",
        enum: ["WEBSITE", "WHATSAPP", "INSTAGRAM", "GOOGLE", "REFERRAL", "MANUAL"]
      },
      LeadStage: {
        type: "string",
        enum: [
          "NEW_LEAD",
          "CONTACT_ATTEMPTED",
          "CONTACTED",
          "QUALIFIED",
          "DOCS_PENDING",
          "BANK_SUBMITTED",
          "SANCTIONED",
          "DISBURSED",
          "REJECTED",
          "CLOSED"
        ]
      },
      PublicLeadRequest: {
        type: "object",
        required: [
          "fullName",
          "phone",
          "city",
          "loanType",
          "employmentType",
          "monthlyIncome",
          "requestedAmount"
        ],
        properties: {
          fullName: { type: "string", example: "Perumal" },
          phone: { type: "string", example: "9876543210" },
          whatsappPhone: {
            type: "string",
            nullable: true,
            example: "9876543210",
            description: "Optional. Leave blank or omit to use phone number."
          },
          city: { type: "string", example: "Kancheepuram" },
          loanType: { $ref: "#/components/schemas/LoanType" },
          employmentType: { $ref: "#/components/schemas/EmploymentType" },
          monthlyIncome: { type: "integer", example: 72000 },
          requestedAmount: { type: "integer", example: 200000 },
          source: { $ref: "#/components/schemas/LeadSource" },
          whatsappOptIn: { type: "boolean", example: true },
          notes: { type: "string", example: "Interested in quick processing" }
        }
      },
      InternalLeadRequest: {
        allOf: [
          { $ref: "#/components/schemas/PublicLeadRequest" },
          {
            type: "object",
            properties: {
              assignedAgentId: {
                type: "string",
                format: "uuid",
                example: "3fa85f64-5717-4562-b3fc-2c963f66afa6"
              }
            }
          }
        ]
      },
      Lead: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          referenceCode: { type: "string", example: "LN-2026-03-003" },
          fullName: { type: "string" },
          phone: { type: "string" },
          whatsappPhone: { type: "string", nullable: true },
          city: { type: "string" },
          loanType: { $ref: "#/components/schemas/LoanType" },
          employmentType: { $ref: "#/components/schemas/EmploymentType" },
          monthlyIncome: { type: "integer" },
          requestedAmount: { type: "integer" },
          source: { $ref: "#/components/schemas/LeadSource" },
          stage: { $ref: "#/components/schemas/LeadStage" },
          whatsappOptIn: { type: "boolean" },
          assignedAgentId: { type: "string", format: "uuid", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" }
        }
      },
      LeadCreateResponse: {
        type: "object",
        properties: {
          message: { type: "string", example: "Lead created successfully" },
          lead: { $ref: "#/components/schemas/Lead" }
        }
      },
      LeadListResponse: {
        type: "object",
        properties: {
          leads: {
            type: "array",
            items: { $ref: "#/components/schemas/Lead" }
          }
        }
      },
      LeadDetailResponse: {
        type: "object",
        properties: {
          lead: { $ref: "#/components/schemas/Lead" }
        }
      },
      UpdateStageRequest: {
        type: "object",
        required: ["stage"],
        properties: {
          stage: { $ref: "#/components/schemas/LeadStage" },
          reason: { type: "string", example: "Customer contacted and qualified" }
        }
      },
      AssignLeadRequest: {
        type: "object",
        required: ["assignedAgentId"],
        properties: {
          assignedAgentId: {
            type: "string",
            format: "uuid",
            nullable: true,
            example: "3fa85f64-5717-4562-b3fc-2c963f66afa6"
          }
        }
      },
      AddLeadNoteRequest: {
        type: "object",
        required: ["body"],
        properties: {
          body: { type: "string", example: "Customer asked for EMI details." }
        }
      },
      CommissionRequest: {
        type: "object",
        required: ["lenderName", "disbursedAmount", "payoutPercent"],
        properties: {
          lenderName: { type: "string", example: "HDFC Bank" },
          disbursedAmount: { type: "integer", example: 1000000 },
          payoutPercent: { type: "number", example: 4.5 },
          addOnPercent: {
            type: "number",
            nullable: true,
            example: 2.5,
            description: "Optional add-on percentage calculated on disbursed amount."
          }
        }
      },
      WhatsappSendRequest: {
        type: "object",
        properties: {
          body: { type: "string", nullable: true, example: "Hi, your application is in progress." },
          templateSid: { type: "string", nullable: true, example: "HX1234567890abcdef" },
          templateVariables: {
            type: "object",
            additionalProperties: { type: "string" },
            example: { "1": "Perumal", "2": "LN-2026-03-003" }
          }
        },
        description: "Provide either body or templateSid."
      },
      LeadUpdateResponse: {
        type: "object",
        properties: {
          message: { type: "string", example: "Lead updated" },
          lead: { $ref: "#/components/schemas/Lead" }
        }
      },
      DashboardSummaryResponse: {
        type: "object",
        properties: {
          totalLeads: { type: "integer", example: 25 },
          stageCounts: {
            type: "object",
            additionalProperties: { type: "integer" },
            example: {
              NEW_LEAD: 8,
              CONTACTED: 6,
              QUALIFIED: 4
            }
          },
          totalRequestedAmount: { type: "number", example: 8200000 },
          totalDisbursedAmount: { type: "number", example: 2400000 },
          totalPartnerPayout: { type: "number", example: 180000 },
          recentLeads: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string", format: "uuid" },
                referenceCode: { type: "string", example: "LN-2026-03-003" },
                fullName: { type: "string", example: "Perumal" },
                phone: { type: "string", example: "9876543210" },
                stage: { $ref: "#/components/schemas/LeadStage" },
                requestedAmount: { type: "integer", example: 200000 },
                city: { type: "string", example: "Chennai" },
                createdAt: { type: "string", format: "date-time" }
              }
            }
          }
        }
      },
      AgentsResponse: {
        type: "object",
        properties: {
          agents: {
            type: "array",
            items: { $ref: "#/components/schemas/AuthUser" }
          }
        }
      }
    }
  }
} as const;

