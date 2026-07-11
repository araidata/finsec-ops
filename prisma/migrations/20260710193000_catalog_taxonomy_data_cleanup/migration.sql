-- Reclassify existing seed/catalog records so SIEM, SOAR, and XDR are
-- capabilities/functions, not Product Components. This preserves existing
-- ProductModule IDs by renaming placeholder rows into commercial components.

INSERT INTO "Capability" ("id", "name", "createdAt", "updatedAt")
VALUES
  ('capability-threat-detection-response', 'Threat Detection and Response', now(), now()),
  ('capability-incident-management', 'Incident Management', now(), now())
ON CONFLICT ("name") DO NOTHING;

WITH xsiam AS (
  SELECT id FROM "Product" WHERE name = 'Cortex XSIAM' LIMIT 1
)
UPDATE "ProductModule"
SET
  "name" = 'Additional Data Ingestion',
  "componentType" = 'CAPACITY',
  "sku" = 'XSIAM-INGEST',
  "licenseMetric" = 'GIGABYTES_PER_DAY',
  "separatelyPurchasable" = true,
  "separatelyRenewable" = true,
  "capabilityCategory" = 'OTHER',
  "purpose" = 'Commercial capacity add-on for expanded log ingestion.',
  "description" = 'Commercial capacity add-on for expanded log ingestion.',
  "updatedAt" = now()
WHERE "productId" = (SELECT id FROM xsiam) AND "name" = 'SIEM';

WITH xsiam AS (
  SELECT id FROM "Product" WHERE name = 'Cortex XSIAM' LIMIT 1
)
UPDATE "ProductModule"
SET
  "name" = 'Premium Support',
  "componentType" = 'SUPPORT',
  "sku" = 'XSIAM-SUPPORT',
  "licenseMetric" = 'FIXED_SERVICE',
  "separatelyPurchasable" = true,
  "separatelyRenewable" = true,
  "capabilityCategory" = 'OTHER',
  "purpose" = 'Commercial support package for the XSIAM deployment.',
  "description" = 'Commercial support package for the XSIAM deployment.',
  "updatedAt" = now()
WHERE "productId" = (SELECT id FROM xsiam) AND "name" = 'SOAR';

WITH xsiam AS (
  SELECT id FROM "Product" WHERE name = 'Cortex XSIAM' LIMIT 1
)
UPDATE "ProductModule"
SET
  "name" = 'Extended Retention',
  "componentType" = 'RETENTION',
  "sku" = 'XSIAM-RETENTION',
  "licenseMetric" = 'TERABYTES',
  "separatelyPurchasable" = true,
  "separatelyRenewable" = true,
  "capabilityCategory" = 'OTHER',
  "purpose" = 'Commercial retention tier for extended investigation history.',
  "description" = 'Commercial retention tier for extended investigation history.',
  "updatedAt" = now()
WHERE "productId" = (SELECT id FROM xsiam) AND "name" = 'XDR';

DELETE FROM "ProductModuleCapability" pmc
USING "ProductModule" pm, "Product" p
WHERE pmc."productModuleId" = pm.id
  AND pm."productId" = p.id
  AND p.name = 'Cortex XSIAM'
  AND pm.name IN ('Premium Support', 'Extended Retention');

WITH xsiam AS (
  SELECT id FROM "Product" WHERE name = 'Cortex XSIAM' LIMIT 1
),
siem AS (
  SELECT id FROM "Capability" WHERE name = 'SIEM' LIMIT 1
),
component AS (
  SELECT id FROM "ProductModule"
  WHERE "productId" = (SELECT id FROM xsiam)
    AND name = 'Additional Data Ingestion'
  LIMIT 1
)
INSERT INTO "ProductModuleCapability" ("productModuleId", "capabilityId", "allocationGuidance")
SELECT component.id, siem.id, 'Use only when spend is explicitly tied to incremental ingestion capacity.'
FROM component, siem
ON CONFLICT ("productModuleId", "capabilityId") DO UPDATE
SET "allocationGuidance" = EXCLUDED."allocationGuidance";

WITH xsiam AS (
  SELECT id FROM "Product" WHERE name = 'Cortex XSIAM' LIMIT 1
),
capability AS (
  SELECT id, name FROM "Capability"
  WHERE name IN ('SIEM', 'SOAR', 'XDR', 'Threat Detection and Response', 'Incident Management')
)
INSERT INTO "ProductCapability" ("productId", "capabilityId")
SELECT xsiam.id, capability.id
FROM xsiam, capability
ON CONFLICT ("productId", "capabilityId") DO NOTHING;

WITH xsiam AS (
  SELECT id FROM "Product" WHERE name = 'Cortex XSIAM' LIMIT 1
),
siem AS (
  SELECT id FROM "Capability" WHERE name = 'SIEM' LIMIT 1
)
UPDATE "ProductFeature"
SET
  "moduleId" = NULL,
  "name" = 'Log ingestion',
  "relatedCapabilityId" = (SELECT id FROM siem),
  "updatedAt" = now()
WHERE "productId" = (SELECT id FROM xsiam) AND "name" = 'Data ingestion';

WITH xsiam AS (
  SELECT id FROM "Product" WHERE name = 'Cortex XSIAM' LIMIT 1
),
soar AS (
  SELECT id FROM "Capability" WHERE name = 'SOAR' LIMIT 1
)
UPDATE "ProductFeature"
SET
  "moduleId" = NULL,
  "relatedCapabilityId" = (SELECT id FROM soar),
  "updatedAt" = now()
WHERE "productId" = (SELECT id FROM xsiam) AND "name" = 'Automation playbooks';

WITH xsiam AS (
  SELECT id FROM "Product" WHERE name = 'Cortex XSIAM' LIMIT 1
),
siem AS (
  SELECT id FROM "Capability" WHERE name = 'SIEM' LIMIT 1
)
INSERT INTO "ProductFeature" ("id", "productId", "name", "description", "relatedCapabilityId", "active", "createdAt", "updatedAt")
SELECT 'seed-xsiam-event-correlation-function', xsiam.id, 'Event correlation', 'Correlation of security events and suspicious activity.', siem.id, true, now(), now()
FROM xsiam, siem
ON CONFLICT DO NOTHING;

WITH xsiam AS (
  SELECT id FROM "Product" WHERE name = 'Cortex XSIAM' LIMIT 1
),
incident AS (
  SELECT id FROM "Capability" WHERE name = 'Incident Management' LIMIT 1
)
INSERT INTO "ProductFeature" ("id", "productId", "name", "description", "relatedCapabilityId", "active", "createdAt", "updatedAt")
SELECT 'seed-xsiam-case-management-function', xsiam.id, 'Case management', 'Security incident case tracking and collaboration.', incident.id, true, now(), now()
FROM xsiam, incident
ON CONFLICT DO NOTHING;

WITH xsiam AS (
  SELECT id FROM "Product" WHERE name = 'Cortex XSIAM' LIMIT 1
),
xdr AS (
  SELECT id FROM "Capability" WHERE name = 'XDR' LIMIT 1
)
INSERT INTO "ProductFeature" ("id", "productId", "name", "description", "relatedCapabilityId", "active", "createdAt", "updatedAt")
SELECT 'seed-xsiam-threat-hunting-function', xsiam.id, 'Threat hunting', 'Cross-domain investigation and proactive threat search.', xdr.id, true, now(), now()
FROM xsiam, xdr
ON CONFLICT DO NOTHING;
