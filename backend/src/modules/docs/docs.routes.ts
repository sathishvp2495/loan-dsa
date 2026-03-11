import { Router } from "express";
import { openApiDocument } from "../../docs/openapi.js";

const router = Router();

router.get("/openapi.json", (_req, res) => {
  return res.json(openApiDocument);
});

router.get("/", (_req, res) => {
  res.type("html");
  return res.send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Loan DSA API Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
    <style>
      body {
        margin: 0;
        background: #f5f7fb;
      }
      .topbar {
        display: none;
      }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.ui = SwaggerUIBundle({
        url: "./openapi.json",
        dom_id: "#swagger-ui",
        deepLinking: true,
        persistAuthorization: true
      });
    </script>
  </body>
</html>`);
});

export const docsRouter = router;

