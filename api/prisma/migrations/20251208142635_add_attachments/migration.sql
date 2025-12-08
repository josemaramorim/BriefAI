-- CreateTable
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "briefingId" TEXT,
    "templateId" TEXT,
    "userId" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "storageProvider" TEXT NOT NULL DEFAULT 'local',
    "storageKey" TEXT NOT NULL,
    "storageMetadata" JSONB NOT NULL DEFAULT '{}',
    "thumbnailKey" TEXT,
    "previewUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Attachment_briefingId_idx" ON "Attachment"("briefingId");

-- CreateIndex
CREATE INDEX "Attachment_templateId_idx" ON "Attachment"("templateId");

-- CreateIndex
CREATE INDEX "Attachment_tenantId_idx" ON "Attachment"("tenantId");

-- CreateIndex
CREATE INDEX "Attachment_userId_idx" ON "Attachment"("userId");

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_briefingId_fkey" FOREIGN KEY ("briefingId") REFERENCES "Briefing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
