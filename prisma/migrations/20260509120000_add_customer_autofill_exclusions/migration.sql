CREATE TABLE "CustomerAutofillExclusion" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'bank',
    "mobile" TEXT NOT NULL,
    "signature" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerAutofillExclusion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CustomerAutofillExclusion_userId_type_mobile_signature_key" ON "CustomerAutofillExclusion"("userId", "type", "mobile", "signature");

CREATE INDEX "CustomerAutofillExclusion_userId_type_mobile_idx" ON "CustomerAutofillExclusion"("userId", "type", "mobile");

ALTER TABLE "CustomerAutofillExclusion" ADD CONSTRAINT "CustomerAutofillExclusion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
