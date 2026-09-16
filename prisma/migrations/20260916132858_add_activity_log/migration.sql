-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL,
    "guest_id" TEXT,
    "guest_name" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "action" TEXT NOT NULL,
    "path" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "activity_logs_created_at_idx" ON "activity_logs"("created_at");

-- CreateIndex
CREATE INDEX "activity_logs_guest_id_idx" ON "activity_logs"("guest_id");

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_guest_id_fkey" FOREIGN KEY ("guest_id") REFERENCES "guests"("id") ON DELETE SET NULL ON UPDATE CASCADE;
