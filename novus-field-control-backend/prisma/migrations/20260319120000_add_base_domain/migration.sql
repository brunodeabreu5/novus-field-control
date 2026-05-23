ALTER TABLE "tenants"
ADD COLUMN "base_domain" TEXT;

UPDATE "tenants"
SET "base_domain" = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      REGEXP_REPLACE("api_base_url", '^https?://', ''),
      '/+$',
      ''
    ),
    '^api\.',
    ''
  )
)
WHERE "base_domain" IS NULL;

ALTER TABLE "tenants"
ALTER COLUMN "base_domain" SET NOT NULL;